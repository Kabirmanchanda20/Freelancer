import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth, requireAdmin } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `select id, full_name, college_email, campus_role, is_admin, is_suspended, avg_rating, can_host_workshops, created_at
       from profiles order by created_at desc limit 200`,
    )
    res.json({ success: true, data: rows })
  }),
)

adminRouter.post(
  '/users/:id/suspend',
  validate({ body: z.object({ suspended: z.boolean() }) }),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, 'INVALID', 'Cannot suspend yourself')
    }
    await query(`update profiles set is_suspended = $2 where id = $1`, [
      req.params.id,
      req.body.suspended,
    ])
    res.json({ success: true, data: null })
  }),
)

adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`
      select
        (select count(*) from profiles) as users,
        (select count(*) from tasks) as tasks,
        (select count(*) from tasks where status = 'open') as open_tasks,
        (select count(*) from disputes where status = 'open') as open_disputes,
        (select count(*) from applications where status = 'pending') as pending_applications,
        (select coalesce(sum(amount),0) from transactions where type = 'escrow_hold') as escrow_held,
        (select coalesce(sum(amount),0) from transactions where type = 'escrow_release') as escrow_released
    `)
    res.json({ success: true, data: rows[0] })
  }),
)

adminRouter.get(
  '/disputes',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `select d.*,
              json_build_object('id', t.id, 'title', t.title, 'status', t.status) as task,
              json_build_object('id', p.id, 'full_name', p.full_name, 'college_email', p.college_email) as raiser
       from disputes d
       join tasks t on t.id = d.task_id
       join profiles p on p.id = d.raised_by
       where d.status = 'open'
       order by d.created_at asc`,
    )
    res.json({ success: true, data: rows })
  }),
)
