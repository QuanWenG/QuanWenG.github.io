import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from './storageKeys'

describe('storage keys', () => {
  it('keeps persisted browser data backward compatible and unique', () => {
    expect(STORAGE_KEYS).toEqual({
      theme: 'quanweng-theme',
      locale: 'quanweng-locale',
      musicVolume: 'quanweng-music-volume',
      musicPlaybackState: 'quanweng-music-playback-state',
    })
    expect(new Set(Object.values(STORAGE_KEYS)).size).toBe(Object.keys(STORAGE_KEYS).length)
  })
})
