import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'spendtracker-super-secret-key-2026';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // 1. Check for standard Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }

  // 2. Allow direct browser evaluation via ?demo=true
  if (req.query.demo === 'true') {
    req.user = { id: 1, email: 'demo@spendtracker.dev', name: 'Alex Chen' };
    return next();
  }

  return res.status(401).json({ 
    error: 'Authentication required. Missing Bearer token.',
    frontendUrl: 'http://localhost:5173',
    hint: "Open the web dashboard at http://localhost:5173 (Click 'Launch One-Click Demo'), or append '?demo=true' to test directly in your browser: e.g. http://localhost:5000/api/spend?demo=true"
  });
}
