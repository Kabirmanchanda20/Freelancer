import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth } from '../../middleware/requireAuth.js'
import { query } from '../../config/db.js'

export const walletRouter = Router()

walletRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(`select wallet_balance from profiles where id = $1`, [
      req.user!.id,
    ])
    const { rows: tx } = await query(
      `select * from transactions
       where from_user = $1 or to_user = $1
       order by created_at desc
       limit 50`,
      [req.user!.id],
    )
    res.json({
      success: true,
      data: {
        balance: Number(rows[0]?.wallet_balance ?? 0),
        transactions: tx,
      },
    })
  }),
)
