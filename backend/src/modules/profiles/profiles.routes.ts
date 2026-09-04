import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { pool, query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

export const profilesRouter = Router()

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  bio: z.string().optional(),
  headline: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
  skill_tags: z.array(z.string()).optional(),
  linkedin_url: z.string().url().optional().nullable(),
  portfolio_url: z.string().url().optional().nullable(),
  is_open_to_work: z.boolean().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  program: z.string().optional().nullable(),
  year_of_study: z.number().int().min(1).max(6).optional().nullable(),
  designation: z.string().optional().nullable(),
  roll_or_employee_id: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  onboarding_completed: z.boolean().optional(),
})

profilesRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select p.*, case when d.id is null then null else json_build_object('id', d.id, 'code', d.code, 'name', d.name) end as department
       from profiles p left join departments d on d.id = p.department_id where p.id = $1`,
      [req.user!.id],
    )
    res.json({ success: true, data: rows[0] })
  }),
)

profilesRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select p.id, p.full_name, p.campus_role, p.headline, p.bio, p.avatar_url, p.skill_tags,
              p.experience_level, p.avg_rating, p.program, p.designation, p.is_open_to_work,
              case when d.id is null then null else json_build_object('id', d.id, 'code', d.code, 'name', d.name) end as department
       from profiles p left join departments d on d.id = p.department_id where p.id = $1`,
      [req.params.id],
    )
    if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Profile not found')
    res.json({ success: true, data: rows[0] })
  }),
)

profilesRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>
    const allowed = [
      'full_name',
      'bio',
      'headline',
      'avatar_url',
      'skill_tags',
      'linkedin_url',
      'portfolio_url',
      'is_open_to_work',
      'experience_level',
      'program',
      'year_of_study',
      'designation',
      'roll_or_employee_id',
      'department_id',
      'onboarding_completed',
    ] as const
    const sets: string[] = []
    const vals: unknown[] = []
    let i = 1
    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${key} = $${i++}`)
        vals.push(body[key])
      }
    }
    if (sets.length === 0) throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update')
    vals.push(req.user!.id)
    const { rows } = await query(
      `update profiles set ${sets.join(', ')}, updated_at = now() where id = $${i} returning *`,
      vals,
    )
    res.json({ success: true, data: rows[0] })
  }),
)

profilesRouter.put(
  '/me/interests',
  requireAuth,
  validate({ body: z.object({ categoryIds: z.array(z.string().uuid()).min(1).max(6) }) }),
  asyncHandler(async (req, res) => {
    const ids = req.body.categoryIds as string[]
    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query(`delete from user_interests where user_id = $1`, [req.user!.id])
      for (const id of ids) {
        await client.query(
          `insert into user_interests (user_id, category_id) values ($1, $2) on conflict do nothing`,
          [req.user!.id, id],
        )
      }
      await client.query('commit')
      res.json({ success: true, data: { categoryIds: ids } })
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }),
)
