import { describe, expect, it } from 'vitest'
import { SIGNUP_BONUS } from './wallet.js'

describe('wallet constants', () => {
  it('gives a useful signup bonus', () => {
    expect(SIGNUP_BONUS).toBe(100)
  })
})
