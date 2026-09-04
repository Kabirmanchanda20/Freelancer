import { pool, query } from '../../config/db.js'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/AppError.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js'
import { hashPassword, hashToken, verifyPassword, verifyTokenHash } from '../../utils/password.js'
import { grantSignupBonus, SIGNUP_BONUS } from '../../utils/wallet.js'
import type { z } from 'zod'
import type { signupSchema } from './auth.schema.js'

type SignupInput = z.infer<typeof signupSchema>

const PROFILE_SELECT = `
  p.*,
  case when d.id is null then null else json_build_object('id', d.id, 'code', d.code, 'name', d.name, 'created_at', d.created_at) end as department
`

async function getProfile(userId: string) {
  const { rows } = await query(
    `select ${PROFILE_SELECT}
     from profiles p
     left join departments d on d.id = p.department_id
     where p.id = $1`,
    [userId],
  )
  return rows[0] ?? null
}

export async function signup(input: SignupInput) {
  const email = input.email.trim().toLowerCase()
  if (!email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`)) {
    throw new AppError(400, 'INVALID_EMAIL', `Only @${env.ALLOWED_EMAIL_DOMAIN} emails allowed`)
  }

  const existing = await query(`select id from app_users where email = $1`, [email])
  if (existing.rows[0]) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered')

  const canHost = ['faculty', 'department', 'phd'].includes(input.campus_role)
  const passwordHash = await hashPassword(input.password)
  const client = await pool.connect()
  try {
    await client.query('begin')
    const userRes = await client.query<{ id: string }>(
      `insert into app_users (email, password_hash) values ($1, $2) returning id`,
      [email, passwordHash],
    )
    const userId = userRes.rows[0]!.id
    await client.query(
      `insert into profiles (
        id, full_name, college_email, campus_role, department_id, roll_or_employee_id,
        program, year_of_study, designation, experience_level, can_host_workshops, wallet_balance
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        userId,
        input.full_name,
        email,
        input.campus_role,
        input.department_id ?? null,
        input.roll_or_employee_id ?? null,
        input.program ?? null,
        input.year_of_study ?? null,
        input.designation ?? null,
        input.experience_level,
        canHost,
        SIGNUP_BONUS,
      ],
    )
    await grantSignupBonus(client, userId)
    await client.query('commit')

    const tokens = await issueTokens(userId, email)
    const profile = await getProfile(userId)
    return { ...tokens, profile }
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}

export async function login(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase()
  const { rows } = await query<{ id: string; password_hash: string }>(
    `select id, password_hash from app_users where email = $1`,
    [email],
  )
  const user = rows[0]
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

  const profile = await getProfile(user.id)
  if (!profile) throw new AppError(401, 'INVALID_CREDENTIALS', 'Profile missing')
  if (profile.is_suspended) throw new AppError(403, 'SUSPENDED', 'Account suspended')

  const tokens = await issueTokens(user.id, email)
  return { ...tokens, profile }
}

async function issueTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email })
  const refreshToken = signRefreshToken({ sub: userId, email })
  const refreshHash = await hashToken(refreshToken)
  await query(`update app_users set refresh_token_hash = $1 where id = $2`, [refreshHash, userId])
  return { accessToken, refreshToken }
}

export async function refresh(refreshToken: string) {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(401, 'TOKEN_EXPIRED', 'Refresh token invalid')
  }

  const { rows } = await query<{ id: string; refresh_token_hash: string | null; email: string }>(
    `select u.id, u.refresh_token_hash, u.email from app_users u where u.id = $1`,
    [payload.sub],
  )
  const user = rows[0]
  if (!user?.refresh_token_hash) throw new AppError(401, 'TOKEN_EXPIRED', 'Refresh token revoked')

  const match = await verifyTokenHash(refreshToken, user.refresh_token_hash)
  if (!match) {
    await query(`update app_users set refresh_token_hash = null where id = $1`, [user.id])
    throw new AppError(401, 'TOKEN_REUSE', 'Refresh token reuse detected')
  }

  return issueTokens(user.id, user.email)
}

export async function logout(userId: string) {
  await query(`update app_users set refresh_token_hash = null where id = $1`, [userId])
}

export async function me(userId: string) {
  const profile = await getProfile(userId)
  if (!profile) throw new AppError(404, 'NOT_FOUND', 'Profile not found')
  return profile
}
