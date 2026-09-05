import { describe, expect, it, vi } from 'vitest'
import { AppError } from './AppError.js'
import {
  SIGNUP_BONUS,
  holdEscrow,
  refundEscrowIfHeld,
  releaseEscrow,
} from './wallet.js'

function mockClient(handler: (sql: string, params?: unknown[]) => { rows: unknown[] }) {
  return {
    query: vi.fn(async (sql: string, params?: unknown[]) => handler(sql, params)),
  }
}

describe('wallet constants', () => {
  it('gives a useful signup bonus', () => {
    expect(SIGNUP_BONUS).toBe(100)
  })
})

describe('holdEscrow', () => {
  it('skips free listings (zero or missing budget)', async () => {
    const client = mockClient(() => ({ rows: [] }))
    await holdEscrow(client as never, { taskId: 't1', posterId: 'p1', amount: 0 })
    await holdEscrow(client as never, { taskId: 't1', posterId: 'p1', amount: NaN as never })
    expect(client.query).not.toHaveBeenCalled()
  })

  it('rejects when poster has insufficient credits', async () => {
    const client = mockClient((sql) => {
      if (sql.includes('wallet_balance') && sql.includes('for update')) {
        return { rows: [{ wallet_balance: '20' }] }
      }
      return { rows: [] }
    })
    await expect(
      holdEscrow(client as never, { taskId: 't1', posterId: 'p1', amount: 50 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INSUFFICIENT_CREDITS',
    } satisfies Partial<AppError>)
  })

  it('debits poster and records escrow_hold', async () => {
    const calls: string[] = []
    const client = mockClient((sql) => {
      calls.push(sql)
      if (sql.includes('for update')) return { rows: [{ wallet_balance: '100' }] }
      return { rows: [] }
    })
    await holdEscrow(client as never, { taskId: 't1', posterId: 'p1', amount: 40 })
    expect(calls.some((s) => s.includes('wallet_balance -'))).toBe(true)
    expect(calls.some((s) => s.includes("'escrow_hold'"))).toBe(true)
  })
})

describe('releaseEscrow', () => {
  it('skips zero amount', async () => {
    const client = mockClient(() => ({ rows: [] }))
    await releaseEscrow(client as never, {
      taskId: 't1',
      posterId: 'p1',
      workerId: 'w1',
      amount: 0,
    })
    expect(client.query).not.toHaveBeenCalled()
  })

  it('credits worker and records escrow_release', async () => {
    const calls: string[] = []
    const client = mockClient((sql) => {
      calls.push(sql)
      return { rows: [] }
    })
    await releaseEscrow(client as never, {
      taskId: 't1',
      posterId: 'p1',
      workerId: 'w1',
      amount: 25,
    })
    expect(calls.some((s) => s.includes('wallet_balance +'))).toBe(true)
    expect(calls.some((s) => s.includes("'escrow_release'"))).toBe(true)
  })
})

describe('refundEscrowIfHeld', () => {
  it('no-ops when no hold exists', async () => {
    const client = mockClient(() => ({ rows: [] }))
    await refundEscrowIfHeld(client as never, { taskId: 't1', posterId: 'p1' })
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('no-ops when release or refund already happened', async () => {
    let n = 0
    const client = mockClient(() => {
      n += 1
      if (n === 1) return { rows: [{ amount: '30' }] }
      return { rows: [{ '?column?': 1 }] }
    })
    await refundEscrowIfHeld(client as never, { taskId: 't1', posterId: 'p1' })
    expect(client.query).toHaveBeenCalledTimes(2)
  })

  it('refunds poster when hold is open', async () => {
    const calls: string[] = []
    let n = 0
    const client = mockClient((sql) => {
      calls.push(sql)
      n += 1
      if (n === 1) return { rows: [{ amount: '30' }] }
      if (n === 2) return { rows: [] }
      return { rows: [] }
    })
    await refundEscrowIfHeld(client as never, { taskId: 't1', posterId: 'p1' })
    expect(calls.some((s) => s.includes("'refund'"))).toBe(true)
    expect(calls.some((s) => s.includes('wallet_balance +'))).toBe(true)
  })
})
