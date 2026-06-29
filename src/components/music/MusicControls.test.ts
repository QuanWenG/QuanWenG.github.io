import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { formatTime, initialVolume, readMusicPlaybackState, writeMusicPlaybackState } from './musicUtils'

beforeEach(() => window.localStorage.clear())

describe('formatTime', () => {
  it('formats media seconds safely', () => {
    expect(formatTime(121.5)).toBe('2:01')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })
})

describe('initialVolume', () => {
  it('defaults to full volume when no preference is stored', () => {
    expect(initialVolume()).toBe(1)
  })

  it('keeps an explicitly stored volume', () => {
    window.localStorage.setItem(STORAGE_KEYS.musicVolume, '0.4')
    expect(initialVolume()).toBe(0.4)
  })
})

describe('music playback persistence', () => {
  it('round-trips the selected track, time, mode and play intent', () => {
    const state = { currentId: 'evo', currentTime: 42.5, repeatMode: 'one' as const, wasPlaying: true }
    writeMusicPlaybackState(state)
    expect(readMusicPlaybackState()).toEqual(state)
  })

  it('ignores malformed stored state', () => {
    window.localStorage.setItem(STORAGE_KEYS.musicPlaybackState, '{"currentTime":-1}')
    expect(readMusicPlaybackState()).toBeNull()
  })
})
