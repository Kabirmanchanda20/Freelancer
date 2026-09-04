import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { query } from '../../config/db.js'

export const recommendationsRouter = Router()

recommendationsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const { rows } = await query(
      `with me as (
         select id, experience_level from profiles where id = $1
       ),
       interests as (
         select category_id from user_interests where user_id = $1
       ),
       stats as (
         select category_id, completed_count from user_category_stats where user_id = $1
       )
       select t.*,
         json_build_object('id', c.id, 'name', c.name) as category,
         json_build_object('id', poster.id, 'full_name', poster.full_name, 'campus_role', poster.campus_role, 'avg_rating', poster.avg_rating, 'avatar_url', poster.avatar_url) as poster
       from tasks t
       cross join me
       join categories c on c.id = t.category_id
       join profiles poster on poster.id = t.poster_id
       where t.status = 'open' and t.poster_id <> $1
       order by
         (
           (case when t.category_id in (select category_id from interests) then 3.0 else 0.0 end)
           + (case when t.difficulty = me.experience_level then 2.0 else 0.5 end)
           + (case when t.created_at > now() - interval '7 days' then 1.5
                   when t.created_at > now() - interval '30 days' then 0.75
                   else 0.25 end)
           + coalesce((select completed_count * 0.5 from stats s where s.category_id = t.category_id), 0)
         ) desc,
         t.created_at desc
       limit $2`,
      [req.user!.id, limit],
    )
    res.json({ success: true, data: rows })
  }),
)
