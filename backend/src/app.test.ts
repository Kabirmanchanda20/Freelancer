import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'

const app = createApp()

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('ok')
  })
})

describe('catalog (public)', () => {
  it('lists departments', async () => {
    const res = await request(app).get('/api/v1/catalog/departments')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('lists categories with kind', async () => {
    const res = await request(app).get('/api/v1/catalog/categories')
    expect(res.status).toBe(200)
    expect(res.body.data[0]).toHaveProperty('name')
    expect(res.body.data[0]).toHaveProperty('kind')
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
        email: 'weak@thapar.edu',
        password: 'short',
        full_name: 'Weak Pass',
        campus_role: 'ug_student',
        experience_level: 'beginner',
      })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('rejects protected routes without token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('tasks public browse', () => {
  it('returns open listings', async () => {
    const res = await request(app).get('/api/v1/tasks?limit=5')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('supports sort=newest', async () => {
    const res = await request(app).get('/api/v1/tasks?sort=newest&limit=3')
    expect(res.status).toBe(200)
  })
})
