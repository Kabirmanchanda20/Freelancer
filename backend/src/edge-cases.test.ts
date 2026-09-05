import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'

const app = createApp()

function uniqEmail(tag: string) {
  return `edge.${tag}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@thapar.edu`
}

async function signup(overrides: Record<string, unknown> = {}) {
  const email = (overrides.email as string) ?? uniqEmail('user')
  const { email: _ignored, ...rest } = overrides
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      password: 'password123',
      full_name: 'Edge Case User',
      campus_role: 'ug_student',
      experience_level: 'beginner',
      ...rest,
      email,
    })
  return { res, email }
}

describe('health & catalog', () => {
  it('returns health ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
  })

  it('lists departments and categories', async () => {
    const depts = await request(app).get('/api/v1/catalog/departments')
    const cats = await request(app).get('/api/v1/catalog/categories')
    expect(depts.status).toBe(200)
    expect(depts.body.data.length).toBeGreaterThan(0)
    expect(cats.status).toBe(200)
    expect(cats.body.data[0]).toHaveProperty('kind')
  })
})

describe('auth edge cases', () => {
  it('rejects non-thapar email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'someone@gmail.com',
        password: 'password123',
        full_name: 'Outsider',
        campus_role: 'ug_student',
        experience_level: 'beginner',
      })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: uniqEmail('weak'),
        password: 'short',
        full_name: 'Weak Pass',
        campus_role: 'ug_student',
        experience_level: 'beginner',
      })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('rejects missing required signup fields', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({ email: uniqEmail('miss') })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('rejects invalid campus_role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: uniqEmail('role'),
        password: 'password123',
        full_name: 'Bad Role',
        campus_role: 'alumni',
        experience_level: 'beginner',
      })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('signs up with bonus wallet and returns profile', async () => {
    const { res } = await signup()
    expect(res.status).toBe(201)
    expect(res.body.data.accessToken).toBeTruthy()
    expect(res.body.data.profile.wallet_balance).toBeDefined()
    expect(Number(res.body.data.profile.wallet_balance)).toBe(100)
  })

  it('rejects duplicate email', async () => {
    const email = uniqEmail('dup')
    const first = await signup({ email })
    expect(first.res.status).toBe(201)
    const second = await signup({ email })
    expect(second.res.status).toBe(409)
    expect(second.res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('logs in with correct credentials', async () => {
    const email = uniqEmail('login')
    await signup({ email, password: 'password123' })
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()
  })

  it('rejects wrong password', async () => {
    const email = uniqEmail('badpw')
    await signup({ email })
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('rejects unknown login email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: uniqEmail('ghost'), password: 'password123' })
    expect(res.status).toBe(401)
  })

  it('rejects protected routes without token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects garbage bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.jwt')
    expect(res.status).toBe(401)
  })

  it('returns me for valid token', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)
    expect(me.status).toBe(200)
    expect(me.body.data.college_email).toContain('@thapar.edu')
  })

  it('refresh fails without token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({})
    expect(res.status).toBe(401)
  })

  it('refresh rotates access token from cookie', async () => {
    const agent = request.agent(app)
    const email = uniqEmail('refresh')
    await agent.post('/api/v1/auth/signup').send({
      email,
      password: 'password123',
      full_name: 'Refresh User',
      campus_role: 'ug_student',
      experience_level: 'beginner',
    })
    const refreshed = await agent.post('/api/v1/auth/refresh').send({})
    expect(refreshed.status).toBe(200)
    expect(refreshed.body.data.accessToken).toBeTruthy()
  })

  it('logout requires auth and clears session', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const out = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
    expect(out.status).toBe(200)
  })
})

describe('tasks browse & filters', () => {
  it('returns open listings', async () => {
    const res = await request(app).get('/api/v1/tasks?limit=5')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('filters by listing_type', async () => {
    const res = await request(app).get('/api/v1/tasks?listing_type=gig&limit=20')
    expect(res.status).toBe(200)
    for (const t of res.body.data) {
      expect(t.listing_type).toBe('gig')
    }
  })

  it('filters by search query', async () => {
    const res = await request(app).get('/api/v1/tasks?q=React&limit=20')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(String(res.body.data[0].title).toLowerCase()).toContain('react')
  })

  it('supports sort options', async () => {
    for (const sort of ['newest', 'deadline', 'budget_high', 'rating']) {
      const res = await request(app).get(`/api/v1/tasks?sort=${sort}&limit=3`)
      expect(res.status).toBe(200)
    }
  })

  it('clamps limit to max 50', async () => {
    const res = await request(app).get('/api/v1/tasks?limit=999')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(50)
  })

  it('404s unknown task id', async () => {
    const res = await request(app).get('/api/v1/tasks/00000000-0000-4000-8000-000000000099')
    expect(res.status).toBe(404)
  })

  it('returns a real task by id', async () => {
    const list = await request(app).get('/api/v1/tasks?limit=1')
    const id = list.body.data[0].id as string
    const one = await request(app).get(`/api/v1/tasks/${id}`)
    expect(one.status).toBe(200)
    expect(one.body.data.id).toBe(id)
    expect(one.body.data.poster).toBeTruthy()
  })

  it('requires auth to create listing', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Need help with React debugging session',
      description: 'Looking for someone to pair for an hour on a campus project.',
      category_id: '00000000-0000-4000-8000-000000000001',
      difficulty: 'beginner',
      listing_type: 'gig',
    })
    expect(res.status).toBe(401)
  })

  it('rejects short title/description on create', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const categoryId = cats.body.data[0].id as string
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hi',
        description: 'Too short',
        category_id: categoryId,
        difficulty: 'beginner',
        listing_type: 'gig',
      })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('creates a gig listing when authenticated', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const categoryId = cats.body.data[0].id as string
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Edge-case gig for Vitest coverage run',
        description:
          'Automated test listing — safe to ignore. Need help verifying create endpoint behavior.',
        category_id: categoryId,
        difficulty: 'beginner',
        listing_type: 'gig',
        budget: 15,
      })
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('open')
    expect(Number(res.body.data.budget)).toBe(15)
  })

  it('blocks workshop create for ug_student', async () => {
    const { res: signupRes } = await signup({ campus_role: 'ug_student' })
    const token = signupRes.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const categoryId = cats.body.data[0].id as string
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Intro to Git for first years workshop',
        description:
          'A hands-on campus workshop covering commits, branches, and pull requests for beginners.',
        category_id: categoryId,
        difficulty: 'beginner',
        listing_type: 'workshop',
      })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('allows workshop create for faculty', async () => {
    const { res: signupRes } = await signup({
      campus_role: 'faculty',
      designation: 'Assistant Professor',
    })
    const token = signupRes.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const categoryId = cats.body.data[0].id as string
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Faculty research methods workshop session',
        description:
          'Campus workshop covering literature review, citation managers, and research writing tips.',
        category_id: categoryId,
        difficulty: 'intermediate',
        listing_type: 'workshop',
        mode: 'hybrid',
        venue: 'CSED Seminar Hall',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.listing_type).toBe('workshop')
  })

  it('requires auth for /tasks/mine', async () => {
    const res = await request(app).get('/api/v1/tasks/mine')
    expect(res.status).toBe(401)
  })
})

describe('applications & wallet edge cases', () => {
  it('requires auth to apply', async () => {
    const list = await request(app).get('/api/v1/tasks?limit=1')
    const taskId = list.body.data[0].id as string
    const res = await request(app).post('/api/v1/applications').send({ task_id: taskId })
    expect(res.status).toBe(401)
  })

  it('rejects apply to own listing', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Own listing apply rejection test case',
        description:
          'Poster should not be allowed to apply to their own open campus listing in this flow.',
        category_id: cats.body.data[0].id,
        difficulty: 'beginner',
        listing_type: 'gig',
        budget: 10,
      })
    const apply = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ task_id: created.body.data.id })
    expect(apply.status).toBe(400)
    expect(apply.body.error.code).toBe('INVALID')
  })

  it('applies once then rejects duplicate application', async () => {
    const poster = await signup({ full_name: 'Poster Edge' })
    const worker = await signup({ full_name: 'Worker Edge' })
    const posterToken = poster.res.body.data.accessToken as string
    const workerToken = worker.res.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({
        title: 'Duplicate application edge case listing',
        description:
          'Worker applies twice to verify conflict handling for the same open campus gig.',
        category_id: cats.body.data[0].id,
        difficulty: 'beginner',
        listing_type: 'gig',
        budget: 12,
      })
    const taskId = created.body.data.id as string
    const first = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ task_id: taskId, message: 'I can help' })
    expect(first.status).toBe(201)
    const second = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ task_id: taskId })
    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('EXISTS')
  })

  it('rejects apply to unknown task', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({ task_id: '00000000-0000-4000-8000-000000000088' })
    expect(res.status).toBe(404)
  })

  it('wallet/me requires auth', async () => {
    const res = await request(app).get('/api/v1/wallet/me')
    expect(res.status).toBe(401)
  })

  it('wallet/me returns signup balance', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const wallet = await request(app)
      .get('/api/v1/wallet/me')
      .set('Authorization', `Bearer ${token}`)
    expect(wallet.status).toBe(200)
    expect(wallet.body.data.balance).toBe(100)
    expect(Array.isArray(wallet.body.data.transactions)).toBe(true)
  })

  it('accept holds escrow and lowers poster balance', async () => {
    const poster = await signup({ full_name: 'Escrow Poster' })
    const worker = await signup({ full_name: 'Escrow Worker' })
    const posterToken = poster.res.body.data.accessToken as string
    const workerToken = worker.res.body.data.accessToken as string
    const cats = await request(app).get('/api/v1/catalog/categories')
    const created = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({
        title: 'Escrow hold edge case paid gig listing',
        description:
          'Accepting an applicant should hold budget credits from the poster wallet via escrow.',
        category_id: cats.body.data[0].id,
        difficulty: 'beginner',
        listing_type: 'gig',
        budget: 25,
      })
    const apply = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ task_id: created.body.data.id })
    expect(apply.status).toBe(201)
    const accept = await request(app)
      .post(`/api/v1/applications/${apply.body.data.id}/accept`)
      .set('Authorization', `Bearer ${posterToken}`)
    expect(accept.status).toBe(200)
    const wallet = await request(app)
      .get('/api/v1/wallet/me')
      .set('Authorization', `Bearer ${posterToken}`)
    expect(wallet.body.data.balance).toBe(75)
  })
})

describe('admin & notifications auth edges', () => {
  it('blocks admin routes for normal users', async () => {
    const { res: signupRes } = await signup()
    const token = signupRes.body.data.accessToken as string
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('blocks admin routes without auth', async () => {
    const res = await request(app).get('/api/v1/admin/users')
    expect(res.status).toBe(401)
  })

  it('notifications require auth', async () => {
    const res = await request(app).get('/api/v1/notifications')
    expect(res.status).toBe(401)
  })

  it('messages require auth', async () => {
    const res = await request(app).get(
      '/api/v1/messages/task/00000000-0000-4000-8000-000000000001',
    )
    expect(res.status).toBe(401)
  })
})
