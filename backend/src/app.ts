import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { env } from './config/env.js'
import { apiRouter } from './routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import rateLimit from './middleware/rateLimit.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  if (env.NODE_ENV === 'development') app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/v1', rateLimit.global, apiRouter)
  app.use(errorHandler)

  return app
}
