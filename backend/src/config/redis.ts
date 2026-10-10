import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

interface CacheStats {
  hits: number;
  misses: number;
  keysCount: number;
  isRedisLive: boolean;
}

class InMemoryCache {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | null = null;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(keys: string | string[]): Promise<number> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    let count = 0;
    for (const k of keyList) {
      if (this.store.delete(k)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
      } else if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  size(): number {
    return this.store.size;
  }
}

let redisClient: Redis | null = null;
const fallbackCache = new InMemoryCache();
let isUsingLiveRedis = false;

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  keysCount: 0,
  isRedisLive: false
};

export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: () => null // Don't hang or spam retries if Redis is not present
    });

    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        console.log('Connected to live Redis server at', redisUrl);
        isUsingLiveRedis = true;
        stats.isRedisLive = true;
        redisClient = client;
        resolve();
      });
      client.on('error', (err) => {
        client.disconnect();
        reject(err);
      });
    });
  } catch (err) {
    console.log('Redis server not available. Using high-speed in-memory cache layer.');
    isUsingLiveRedis = false;
    stats.isRedisLive = false;
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    let raw: string | null = null;
    if (isUsingLiveRedis && redisClient) {
      raw = await redisClient.get(key);
    } else {
      raw = await fallbackCache.get(key);
    }

    if (raw) {
      stats.hits++;
      return JSON.parse(raw) as T;
    }
    stats.misses++;
    return null;
  } catch (err) {
    console.error(`Cache get error for ${key}:`, err);
    stats.misses++;
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (isUsingLiveRedis && redisClient) {
      await redisClient.set(key, raw, 'EX', ttlSeconds);
    } else {
      await fallbackCache.set(key, raw, 'EX', ttlSeconds);
    }
  } catch (err) {
    console.error(`Cache set error for ${key}:`, err);
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  try {
    let keysToDelete: string[] = [];
    if (isUsingLiveRedis && redisClient) {
      keysToDelete = await redisClient.keys(pattern);
      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }
    } else {
      keysToDelete = await fallbackCache.keys(pattern);
      if (keysToDelete.length > 0) {
        await fallbackCache.del(keysToDelete);
      }
    }
    return keysToDelete.length;
  } catch (err) {
    console.error(`Cache invalidation error for ${pattern}:`, err);
    return 0;
  }
}

export async function cacheFlush(): Promise<void> {
  if (isUsingLiveRedis && redisClient) {
    await redisClient.flushall();
  } else {
    await fallbackCache.flushall();
  }
  stats.hits = 0;
  stats.misses = 0;
}

export function getCacheStats(): CacheStats {
  stats.keysCount = isUsingLiveRedis ? -1 : fallbackCache.size();
  return { ...stats };
}
