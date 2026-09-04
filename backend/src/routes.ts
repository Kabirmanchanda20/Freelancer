import { Router } from 'express'
import rateLimit from './middleware/rateLimit.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { profilesRouter } from './modules/profiles/profiles.routes.js'
import { catalogRouter } from './modules/catalog/catalog.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', rateLimit.auth, authRouter)
apiRouter.use('/catalog', catalogRouter)
apiRouter.use('/profiles', profilesRouter)
