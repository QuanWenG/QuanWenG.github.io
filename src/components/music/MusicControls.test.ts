import { describe, expect, it } from 'vitest'
import { formatTime, initialVolume } from './musicUtils'

describe('formatTime', () => {
  it('formats media seconds safely', () => {
    expect(formatTime(121.5)).toBe('2:01')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })
})
describe('initialVolume', () => {
  it('defaults to full volume when no preference is stored', () => {
    window.localStorage.removeItem('quanweng-music-volume')
    expect(initialVolume()).toBe(1)
  })

  it('keeps an explicitly stored volume', () => {
    window.localStorage.setItem('quanweng-music-volume', '0.4')
    expect(initialVolume()).toBe(0.4)
  })
})