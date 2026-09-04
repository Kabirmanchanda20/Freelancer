import { Router } from 'express'
import rateLimit from './middleware/rateLimit.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { profilesRouter } from './modules/profiles/profiles.routes.js'
import { tasksRouter } from './modules/tasks/tasks.routes.js'
import { applicationsRouter } from './modules/applications/applications.routes.js'
import { catalogRouter } from './modules/catalog/catalog.routes.js'
import { reviewsRouter } from './modules/reviews/reviews.routes.js'
import { disputesRouter } from './modules/disputes/disputes.routes.js'
import { messagesRouter } from './modules/messages/messages.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { recommendationsRouter } from './modules/recommendations/recommendations.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { uploadsRouter } from './modules/uploads/uploads.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', rateLimit.auth, authRouter)
apiRouter.use('/catalog', catalogRouter)
apiRouter.use('/profiles', profilesRouter)
apiRouter.use('/tasks', tasksRouter)
apiRouter.use('/applications', applicationsRouter)
apiRouter.use('/reviews', reviewsRouter)
apiRouter.use('/disputes', disputesRouter)
apiRouter.use('/messages', messagesRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/recommendations', recommendationsRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/uploads', uploadsRouter)
