import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { query } from '../../config/db.js'

export const notificationsRouter = Router()

notificationsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select * from notifications where user_id = $1 order by created_at desc limit 50`,
      [req.user!.id],
    )
    res.json({ success: true, data: rows })
  }),
)

notificationsRouter.get(
  '/unread-count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query<{ count: string }>(
      `select count(*)::text as count from notifications where user_id = $1 and is_read = false`,
      [req.user!.id],
    )
    res.json({ success: true, data: { count: Number(rows[0]?.count ?? 0) } })
  }),
)

notificationsRouter.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await query(`update notifications set is_read = true where user_id = $1 and is_read = false`, [
      req.user!.id,
    ])
    res.json({ success: true, data: null })
  }),
)

notificationsRouter.post(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await query(
      `update notifications set is_read = true where id = $1 and user_id = $2`,
      [req.params.id, req.user!.id],
    )
    res.json({ success: true, data: null })
  }),
)
