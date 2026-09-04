import type { PoolClient } from 'pg'
import { AppError } from '../utils/AppError.js'

const SIGNUP_BONUS = 100

export { SIGNUP_BONUS }

/** Hold credits from poster when an application is accepted. */
export async function holdEscrow(
  client: PoolClient,
  opts: { taskId: string; posterId: string; amount: number },
) {
  const amount = Number(opts.amount)
  if (!amount || amount <= 0) return // free listings skip escrow

  const { rows } = await client.query<{ wallet_balance: string }>(
    `select wallet_balance from profiles where id = $1 for update`,
    [opts.posterId],
  )
  const balance = Number(rows[0]?.wallet_balance ?? 0)
  if (balance < amount) {
    throw new AppError(400, 'INSUFFICIENT_CREDITS', `Need ${amount} credits to assign this gig (you have ${balance})`)
  }

  await client.query(`update profiles set wallet_balance = wallet_balance - $2 where id = $1`, [
    opts.posterId,
    amount,
  ])
  await client.query(
    `insert into transactions (task_id, from_user, to_user, amount, type)
     values ($1, $2, null, $3, 'escrow_hold')`,
    [opts.taskId, opts.posterId, amount],
  )
}

/** Release held escrow to worker on task completion. */
export async function releaseEscrow(
  client: PoolClient,
  opts: { taskId: string; posterId: string; workerId: string; amount: number },
) {
  const amount = Number(opts.amount)
  if (!amount || amount <= 0) return

  await client.query(`update profiles set wallet_balance = wallet_balance + $2 where id = $1`, [
    opts.workerId,
    amount,
  ])
  await client.query(
    `insert into transactions (task_id, from_user, to_user, amount, type)
     values ($1, $2, $3, $4, 'escrow_release')`,
    [opts.taskId, opts.posterId, opts.workerId, amount],
  )
}

/** Refund escrow to poster on cancel (if a hold exists and no release yet). */
export async function refundEscrowIfHeld(
  client: PoolClient,
  opts: { taskId: string; posterId: string },
) {
  const { rows: holds } = await client.query<{ amount: string }>(
    `select amount from transactions
     where task_id = $1 and type = 'escrow_hold'
     order by created_at desc limit 1`,
    [opts.taskId],
  )
  if (!holds[0]) return

  const { rows: released } = await client.query(
    `select 1 from transactions where task_id = $1 and type in ('escrow_release', 'refund') limit 1`,
    [opts.taskId],
  )
  if (released[0]) return

  const amount = Number(holds[0].amount)
  await client.query(`update profiles set wallet_balance = wallet_balance + $2 where id = $1`, [
    opts.posterId,
    amount,
  ])
  await client.query(
    `insert into transactions (task_id, from_user, to_user, amount, type)
     values ($1, null, $2, $3, 'refund')`,
    [opts.taskId, opts.posterId, amount],
  )
}

export async function grantSignupBonus(client: PoolClient, userId: string) {
  await client.query(
    `insert into transactions (task_id, from_user, to_user, amount, type)
     values (null, null, $1, $2, 'signup_bonus')`,
    [userId, SIGNUP_BONUS],
  )
}
