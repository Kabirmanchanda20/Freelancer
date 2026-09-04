import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

export const reviewsRouter = Router()

reviewsRouter.get(
  '/task/:taskId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select r.*, json_build_object('id', p.id, 'full_name', p.full_name) as reviewer
       from reviews r join profiles p on p.id = r.reviewer_id
       where r.task_id = $1`,
      [req.params.taskId],
    )
    res.json({ success: true, data: rows })
  }),
)

reviewsRouter.post(
  '/',
  requireAuth,
  validate({
    body: z.object({
      task_id: z.string().uuid(),
      reviewee_id: z.string().uuid(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { task_id, reviewee_id, stars, comment } = req.body
    const { rows } = await query(`select * from tasks where id = $1`, [task_id])
    const task = rows[0]
    if (!task || task.status !== 'completed') {
      throw new AppError(400, 'INVALID_STATUS', 'Reviews only after completion')
    }
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    if (reviewee_id === req.user!.id) throw new AppError(400, 'INVALID', 'Cannot review yourself')
    if (reviewee_id !== task.poster_id && reviewee_id !== task.worker_id) {
      throw new AppError(400, 'INVALID', 'Invalid reviewee')
    }

    const inserted = await query(
      `insert into reviews (task_id, reviewer_id, reviewee_id, stars, comment)
       values ($1,$2,$3,$4,$5) returning id`,
      [task_id, req.user!.id, reviewee_id, stars, comment ?? null],
    )
    const avg = await query<{ avg: string }>(
      `select round(avg(stars)::numeric, 2) as avg from reviews where reviewee_id = $1`,
      [reviewee_id],
    )
    await query(`update profiles set avg_rating = $1 where id = $2`, [
      avg.rows[0]?.avg ?? 0,
      reviewee_id,
    ])
    res.status(201).json({ success: true, data: { id: inserted.rows[0]!.id } })
  }),
)

export const disputesRouter = Router()

disputesRouter.post(
  '/',
  requireAuth,
  validate({ body: z.object({ task_id: z.string().uuid(), reason: z.string().min(5) }) }),
  asyncHandler(async (req, res) => {
    const { rows } = await query(`select * from tasks where id = $1`, [req.body.task_id])
    const task = rows[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    if (!['assigned', 'submitted', 'disputed'].includes(task.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Invalid status for dispute')
    }
    await query(`update tasks set status = 'disputed', updated_at = now() where id = $1`, [
      task.id,
    ])
    const { rows: d } = await query(
      `insert into disputes (task_id, raised_by, reason) values ($1,$2,$3) returning id`,
      [task.id, req.user!.id, req.body.reason],
    )
    res.status(201).json({ success: true, data: { id: d[0]!.id } })
  }),
)

disputesRouter.get(
  '/open',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user!.is_admin) throw new AppError(403, 'FORBIDDEN', 'Admin only')
    const { rows } = await query(
      `select d.*,
        json_build_object('id', t.id, 'title', t.title, 'status', t.status) as task,
        json_build_object('id', p.id, 'full_name', p.full_name) as raiser
       from disputes d
       join tasks t on t.id = d.task_id
       join profiles p on p.id = d.raised_by
       where d.status = 'open'
       order by d.created_at desc`,
    )
    res.json({ success: true, data: rows })
  }),
)

disputesRouter.post(
  '/:id/resolve',
  requireAuth,
  validate({
    body: z.object({
      resolution: z.string().min(3),
      action: z.enum(['complete', 'cancel']).default('complete'),
    }),
  }),
  asyncHandler(async (req, res) => {
    if (!req.user!.is_admin) throw new AppError(403, 'FORBIDDEN', 'Admin only')
    const { rows } = await query(`select * from disputes where id = $1`, [req.params.id])
    const dispute = rows[0]
    if (!dispute) throw new AppError(404, 'NOT_FOUND', 'Dispute not found')
    await query(
      `update disputes set status = 'resolved', resolution = $2, resolved_by = $3, resolved_at = now() where id = $1`,
      [dispute.id, req.body.resolution, req.user!.id],
    )
    const status = req.body.action === 'cancel' ? 'cancelled' : 'completed'
    await query(`update tasks set status = $2, updated_at = now() where id = $1`, [
      dispute.task_id,
      status,
    ])
    res.json({ success: true, data: null })
  }),
)
