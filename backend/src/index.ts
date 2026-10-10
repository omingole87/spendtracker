import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/init';
import { initRedis } from './config/redis';
import authRoutes from './routes/authRoutes';
import spendRoutes from './routes/spendRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import ruleRoutes from './routes/ruleRoutes';
import benchmarkRoutes from './routes/benchmarkRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  exposedHeaders: ['Server-Timing', 'X-Cache']
}));
app.use(express.json());

// Server-timing response tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  res.on('finish', () => {
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    // Keep timing header concise
  });
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SpendTracker API'
  });
});

// Root Landing page
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SpendTracker Backend API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #f1f5f9; padding: 40px 20px; line-height: 1.6; }
        .card { max-width: 650px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        h1 { color: #818cf8; margin-top: 0; font-size: 26px; }
        .badge { display: inline-block; background: #064e3b; color: #34d399; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 15px 0 25px 0; }
        .btn:hover { opacity: 0.9; }
        ul { padding-left: 20px; color: #cbd5e1; }
        li { margin-bottom: 8px; }
        code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38bdf8; }
        a { color: #818cf8; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● API Online</span>
        <h1>SpendTracker Backend Service</h1>
        <p>You have accessed the SpendTracker REST API server on <code>port 5000</code>.</p>
        
        <p><strong>Looking for the interactive Web Dashboard?</strong></p>
        <a href="http://localhost:5173" class="btn" target="_blank">🚀 Open Frontend Dashboard (http://localhost:5173)</a>
        
        <h3>Direct API Test Endpoints (Demo Mode):</h3>
        <ul>
          <li><a href="/api/spend?demo=true" target="_blank"><code>GET /api/spend?demo=true</code></a> — Unified Spend Aggregate (CTE + Redis Cache)</li>
          <li><a href="/api/transactions?demo=true" target="_blank"><code>GET /api/transactions?demo=true</code></a> — Transactions List</li>
          <li><a href="/api/categories?demo=true" target="_blank"><code>GET /api/categories?demo=true</code></a> — Categories & Budgets</li>
          <li><a href="/api/rules?demo=true" target="_blank"><code>GET /api/rules?demo=true</code></a> — Auto-categorization Rules</li>
          <li><a href="/api/health" target="_blank"><code>GET /api/health</code></a> — Health Check</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/spend', spendRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/benchmark', benchmarkRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function startServer() {
  try {
    console.log('--- Starting SpendTracker Server ---');
    await initDB();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`SpendTracker backend running on http://localhost:${PORT}`);
      console.log(`Unified Spend Aggregate: http://localhost:${PORT}/api/spend`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
