import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

const skipInTest = () => env.NODE_ENV === 'test'

export const global = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
})

export const auth = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
})

export default { global, auth }
