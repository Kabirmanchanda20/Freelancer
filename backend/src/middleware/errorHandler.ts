import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    })
  }

  logger.error({ err }, 'Unhandled error')
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Something went wrong' : String(err),
    },
  })
}
