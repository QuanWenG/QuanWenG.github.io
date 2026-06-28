import { describe, expect, it } from 'vitest'
import { formatTime } from './musicUtils'

describe('formatTime', () => {
  it('formats media seconds safely', () => {
    expect(formatTime(121.5)).toBe('2:01')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })
})