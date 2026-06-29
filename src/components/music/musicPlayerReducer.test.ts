import { describe, expect, it } from 'vitest'
import { musicPlayerReducer, type MusicPlayerRuntimeState } from './musicPlayerReducer'

const initial: MusicPlayerRuntimeState = {
  currentId: 'one',
  isPlaying: false,
  currentTime: 0,
  duration: 100,
  volume: 1,
  repeatMode: 'all',
  energy: 0,
  spectrum: [0, 0, 0, 0, 0],
  error: null,
}

describe('musicPlayerReducer', () => {
  it('changes tracks without losing unrelated player preferences', () => {
    const next = musicPlayerReducer(initial, { type: 'trackChanged', currentId: 'two', currentTime: 12, duration: 90 })
    expect(next).toMatchObject({ currentId: 'two', currentTime: 12, duration: 90, volume: 1, repeatMode: 'all' })
  })

  it('updates repeat and visualization state predictably', () => {
    const repeated = musicPlayerReducer(initial, { type: 'repeatChanged', repeatMode: 'one' })
    const visualized = musicPlayerReducer(repeated, { type: 'visualizationChanged', energy: 0.5, spectrum: [1, 0.5] })
    expect(visualized).toMatchObject({ repeatMode: 'one', energy: 0.5, spectrum: [1, 0.5] })
  })
})
