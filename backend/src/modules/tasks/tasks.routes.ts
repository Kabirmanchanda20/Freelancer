import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { optionalAuth, requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { pool, query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { refundEscrowIfHeld, releaseEscrow } from '../../utils/wallet.js'

export const tasksRouter = Router()

const taskSelect = `
  t.*,
  json_build_object('id', c.id, 'name', c.name, 'kind', c.kind) as category,
  json_build_object(
    'id', poster.id,
    'full_name', poster.full_name,
    'campus_role', poster.campus_role,
    'avg_rating', poster.avg_rating,
    'avatar_url', poster.avatar_url,
    'completed_count', poster.completed_count,
    'college_email', poster.college_email
  ) as poster,
  case when worker.id is null then null else json_build_object(
    'id', worker.id,
    'full_name', worker.full_name,
    'campus_role', worker.campus_role,
    'avg_rating', worker.avg_rating,
    'avatar_url', worker.avatar_url,
    'completed_count', worker.completed_count
  ) end as worker
`

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category_id: z.string().uuid(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  listing_type: z.enum(['gig', 'workshop', 'project', 'mentorship']),
  budget: z.number().min(0).max(10000).optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  venue: z.string().optional().nullable(),
  mode: z.enum(['in_person', 'online', 'hybrid']).optional().nullable(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  max_participants: z.number().int().positive().optional().nullable(),
  target_department_id: z.string().uuid().optional().nullable(),
})

tasksRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(0, Number(req.query.page ?? 0))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12)))
    const offset = page * limit
    const status = (req.query.status as string) || 'open'
    const vals: unknown[] = [status]
    let where = `t.status = $1`
    let i = 2

    if (req.query.listing_type) {
      where += ` and t.listing_type = $${i++}`
      vals.push(req.query.listing_type)
    }
    if (req.query.category_id) {
      where += ` and t.category_id = $${i++}`
      vals.push(req.query.category_id)
    }
    if (req.query.difficulty) {
      where += ` and t.difficulty = $${i++}`
      vals.push(req.query.difficulty)
    }
    if (req.query.department_id) {
      where += ` and (t.target_department_id = $${i} or poster.department_id = $${i})`
      vals.push(req.query.department_id)
      i++
    }
    if (req.query.q) {
      where += ` and t.title ilike $${i++}`
      vals.push(`%${req.query.q}%`)
    }

    const sort = (req.query.sort as string) || 'newest'
    let orderBy = 't.created_at desc'
    if (sort === 'deadline') orderBy = 't.deadline asc nulls last, t.created_at desc'
    else if (sort === 'budget_high') orderBy = 't.budget desc, t.created_at desc'
    else if (sort === 'rating') orderBy = 'poster.avg_rating desc, t.created_at desc'

    vals.push(limit, offset)
    const { rows } = await query(
      `select ${taskSelect}
       from tasks t
       join categories c on c.id = t.category_id
       join profiles poster on poster.id = t.poster_id
       left join profiles worker on worker.id = t.worker_id
       where ${where}
       order by ${orderBy}
       limit $${i++} offset $${i}`,
      vals,
    )
    res.json({ success: true, data: rows })
  }),
)

tasksRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select ${taskSelect}
       from tasks t
       join categories c on c.id = t.category_id
       join profiles poster on poster.id = t.poster_id
       left join profiles worker on worker.id = t.worker_id
       where t.poster_id = $1 or t.worker_id = $1
       order by t.updated_at desc`,
      [req.user!.id],
    )
    res.json({ success: true, data: rows })
  }),
)

tasksRouter.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select ${taskSelect}
       from tasks t
       join categories c on c.id = t.category_id
       join profiles poster on poster.id = t.poster_id
       left join profiles worker on worker.id = t.worker_id
       where t.id = $1`,
      [req.params.id],
    )
    if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    res.json({ success: true, data: rows[0] })
  }),
)

tasksRouter.post(
  '/',
  requireAuth,
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const b = req.body
    if (b.listing_type === 'workshop' && !req.user!.can_host_workshops) {
      throw new AppError(403, 'FORBIDDEN', 'Your role cannot host workshops')
    }
    const { rows } = await query(
      `insert into tasks (
        poster_id, title, description, category_id, difficulty, listing_type, budget,
        deadline, venue, mode, starts_at, ends_at, max_participants, target_department_id
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      returning id`,
      [
        req.user!.id,
        b.title,
        b.description,
        b.category_id,
        b.difficulty,
        b.listing_type,
        b.budget ?? 0,
        b.deadline ?? null,
        b.venue ?? null,
        b.mode ?? null,
        b.starts_at ?? null,
        b.ends_at ?? null,
        b.max_participants ?? null,
        b.target_department_id ?? null,
      ],
    )
    const id = rows[0]!.id as string
    const full = await query(
      `select ${taskSelect}
       from tasks t
       join categories c on c.id = t.category_id
       join profiles poster on poster.id = t.poster_id
       left join profiles worker on worker.id = t.worker_id
       where t.id = $1`,
      [id],
    )
    res.status(201).json({ success: true, data: full.rows[0] })
  }),
)

tasksRouter.post(
  '/:id/submit',
  requireAuth,
  validate({ body: z.object({ proof_url: z.string().url().optional().nullable() }) }),
  asyncHandler(async (req, res) => {
    const { rows } = await query(`select * from tasks where id = $1`, [req.params.id])
    const task = rows[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (task.worker_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Only assigned worker')
    if (task.status !== 'assigned') throw new AppError(400, 'INVALID_STATUS', 'Task must be assigned')
    await query(
      `update tasks set status = 'submitted', proof_url = coalesce($2, proof_url), updated_at = now() where id = $1`,
      [req.params.id, req.body.proof_url ?? null],
    )
    await query(
      `insert into notifications (user_id, type, payload) values ($1, 'work_submitted', $2)`,
      [task.poster_id, JSON.stringify({ task_id: task.id })],
    )
    res.json({ success: true, data: null })
  }),
)

tasksRouter.post(
  '/:id/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const client = await pool.connect()
    try {
      await client.query('begin')
      const { rows } = await client.query(`select * from tasks where id = $1 for update`, [
        req.params.id,
      ])
      const task = rows[0]
      if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
      if (task.poster_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Only poster')
      if (!['submitted', 'assigned'].includes(task.status)) {
        throw new AppError(400, 'INVALID_STATUS', 'Cannot complete from this status')
      }
      await client.query(`update tasks set status = 'completed', updated_at = now() where id = $1`, [
        task.id,
      ])
      if (task.worker_id) {
        await releaseEscrow(client, {
          taskId: task.id,
          posterId: task.poster_id,
          workerId: task.worker_id,
          amount: Number(task.budget),
        })
        await client.query(
          `update profiles set completed_count = completed_count + 1 where id = any($1::uuid[])`,
          [[task.poster_id, task.worker_id]],
        )
        await client.query(
          `insert into user_category_stats (user_id, category_id, completed_count)
           values ($1, $2, 1)
           on conflict (user_id, category_id)
           do update set completed_count = user_category_stats.completed_count + 1`,
          [task.worker_id, task.category_id],
        )
        await client.query(
          `insert into notifications (user_id, type, payload) values ($1, 'task_completed', $2)`,
          [task.worker_id, JSON.stringify({ task_id: task.id })],
        )
      }
      await client.query('commit')
      res.json({ success: true, data: null })
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }),
)

tasksRouter.post(
  '/:id/cancel',
  requireAuth,
  validate({ body: z.object({ reason: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const client = await pool.connect()
    try {
      await client.query('begin')
      const { rows } = await client.query(`select * from tasks where id = $1 for update`, [
        req.params.id,
      ])
      const task = rows[0]
      if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
      if (task.poster_id !== req.user!.id && task.worker_id !== req.user!.id) {
        throw new AppError(403, 'FORBIDDEN', 'Only participants')
      }
      if (['completed', 'cancelled'].includes(task.status)) {
        throw new AppError(400, 'INVALID_STATUS', 'Already finalized')
      }
      await refundEscrowIfHeld(client, { taskId: task.id, posterId: task.poster_id })
      await client.query(`update tasks set status = 'cancelled', updated_at = now() where id = $1`, [
        task.id,
      ])
      await client.query('commit')
      res.json({ success: true, data: null })
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }),
)

tasksRouter.post(
  '/:id/complete-workshop',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(`select * from tasks where id = $1`, [req.params.id])
    const task = rows[0]
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found')
    if (task.poster_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Only host')
    if (task.listing_type !== 'workshop' || task.status !== 'open') {
      throw new AppError(400, 'INVALID_STATUS', 'Only open workshops')
    }
    await query(`update tasks set status = 'completed', updated_at = now() where id = $1`, [
      task.id,
    ])
    res.json({ success: true, data: null })
  }),
)
