import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { query } from '../../config/db.js'

export const catalogRouter = Router()

catalogRouter.get(
  '/departments',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(`select * from departments order by code`)
    res.json({ success: true, data: rows })
  }),
)

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `select * from categories order by kind desc, name`,
    )
    res.json({ success: true, data: rows })
  }),
)
