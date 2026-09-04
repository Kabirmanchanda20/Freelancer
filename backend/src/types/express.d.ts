import type { Request } from 'express'

export type AuthUser = {
  id: string
  email: string
  is_admin: boolean
  is_suspended: boolean
  campus_role: string
  can_host_workshops: boolean
  onboarding_completed: boolean
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export type AuthedRequest = Request & { user: AuthUser }
