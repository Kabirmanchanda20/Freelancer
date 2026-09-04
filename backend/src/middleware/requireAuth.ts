import type { NextFunction, Request, Response } from 'express'
import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/jwt.js'

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing access token')
    }
    const token = header.slice(7)
    const payload = verifyAccessToken(token)

    const { rows } = await query<{
      id: string
      college_email: string
      is_admin: boolean
      is_suspended: boolean
      campus_role: string
      can_host_workshops: boolean
      onboarding_completed: boolean
    }>(
      `select id, college_email, is_admin, is_suspended, campus_role, can_host_workshops, onboarding_completed
       from profiles where id = $1`,
      [payload.sub],
    )

    const profile = rows[0]
    if (!profile) throw new AppError(401, 'UNAUTHORIZED', 'User not found')
    if (profile.is_suspended) throw new AppError(403, 'SUSPENDED', 'Account suspended')

    req.user = {
      id: profile.id,
      email: profile.college_email,
      is_admin: profile.is_admin,
      is_suspended: profile.is_suspended,
      campus_role: profile.campus_role,
      can_host_workshops: profile.can_host_workshops,
      onboarding_completed: profile.onboarding_completed,
    }
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'))
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  void requireAuth(req, _res, next)
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.is_admin) {
    return next(new AppError(403, 'FORBIDDEN', 'Admin only'))
  }
  next()
}
