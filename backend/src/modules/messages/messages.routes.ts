import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

export const messagesRouter = Router()

messagesRouter.get(
  '/task/:taskId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows: tasks } = await query(`select poster_id, worker_id from tasks where id = $1`, [
      req.params.taskId,
    ])
    const task = tasks[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    const { rows } = await query(
      `select m.*, json_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url) as sender
       from messages m join profiles p on p.id = m.sender_id
       where m.task_id = $1
       order by m.created_at asc`,
      [req.params.taskId],
    )
    res.json({ success: true, data: rows })
  }),
)

messagesRouter.post(
  '/',
  requireAuth,
  validate({
    body: z.object({
      task_id: z.string().uuid(),
      content: z.string().min(1).max(4000),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { rows: tasks } = await query(`select poster_id, worker_id from tasks where id = $1`, [
      req.body.task_id,
    ])
    const task = tasks[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (req.user!.id !== task.poster_id && req.user!.id !== task.worker_id) {
      throw new AppError(403, 'FORBIDDEN', 'Participants only')
    }
    const { rows } = await query(
      `insert into messages (task_id, sender_id, content) values ($1,$2,$3) returning *`,
      [req.body.task_id, req.user!.id, req.body.content],
    )
    const other = req.user!.id === task.poster_id ? task.worker_id : task.poster_id
    if (other) {
      await query(
        `insert into notifications (user_id, type, payload) values ($1, 'new_message', $2)`,
        [other, JSON.stringify({ task_id: req.body.task_id })],
      )
    }
    res.status(201).json({ success: true, data: rows[0] })
  }),
)

messagesRouter.get(
  '/inbox',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select distinct on (t.id) t.id as task_id, t.title, t.status,
              m.content as last_message, m.created_at as last_at
       from tasks t
       join messages m on m.task_id = t.id
       where t.poster_id = $1 or t.worker_id = $1
       order by t.id, m.created_at desc`,
      [req.user!.id],
    )
    res.json({ success: true, data: rows })
  }),
)
