import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { validate } from '../../middleware/validate.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { env } from '../../config/env.js'
import * as authService from './auth.service.js'
import { loginSchema, signupSchema } from './auth.schema.js'

export const authRouter = Router()

authRouter.post(
  '/signup',
  validate({ body: signupSchema }),
  asyncHandler(async (req, res) => {
    const data = await authService.signup(req.body)
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(201).json({
      success: true,
      data: { accessToken: data.accessToken, profile: data.profile },
    })
  }),
)

authRouter.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const data = await authService.login(req.body.email, req.body.password)
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({
      success: true,
      data: { accessToken: data.accessToken, profile: data.profile },
    })
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.refreshToken as string | undefined) ?? req.body?.refreshToken
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'No refresh token' },
      })
      return
    }
    const data = await authService.refresh(token)
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { accessToken: data.accessToken } })
  }),
)

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id)
    res.clearCookie('refreshToken')
    res.json({ success: true, data: null })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await authService.me(req.user!.id)
    res.json({ success: true, data: profile })
  }),
)
