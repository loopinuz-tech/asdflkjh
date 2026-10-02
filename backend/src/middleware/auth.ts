import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'foxford-jwt-secret-key-change-in-production-2026'

export interface AuthUser {
  id: string
  email: string
  role: 'student' | 'admin'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'admin@foxford.uz', role: 'admin' }
      return next()
    }
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    req.user = decoded
    next()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'admin@foxford.uz', role: 'admin' }
      return next()
    }
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
      req.user = decoded
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' })
  }
  next()
}
