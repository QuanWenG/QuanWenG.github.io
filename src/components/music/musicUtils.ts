export const MUSIC_VOLUME_KEY = 'quanweng-music-volume'
export const MUSIC_PLAYBACK_STATE_KEY = 'quanweng-music-playback-state'

export interface StoredMusicPlaybackState {
  currentId: string | null
  currentTime: number
  repeatMode: 'all' | 'one'
  wasPlaying: boolean
}

export function initialVolume(storage: Pick<Storage, 'getItem'> = window.localStorage) {
  const stored = storage.getItem(MUSIC_VOLUME_KEY)
  if (stored === null) return 1
  const saved = Number(stored)
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 1
}

export function readMusicPlaybackState(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): StoredMusicPlaybackState | null {
  try {
    const raw = storage.getItem(MUSIC_PLAYBACK_STATE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<StoredMusicPlaybackState>
    if (
      (value.currentId !== null && typeof value.currentId !== 'string')
      || typeof value.currentTime !== 'number'
      || !Number.isFinite(value.currentTime)
      || value.currentTime < 0
      || (value.repeatMode !== 'all' && value.repeatMode !== 'one')
      || typeof value.wasPlaying !== 'boolean'
    ) return null
    return {
      currentId: value.currentId,
      currentTime: value.currentTime,
      repeatMode: value.repeatMode,
      wasPlaying: value.wasPlaying,
    }
  } catch {
    return null
  }
}

export function writeMusicPlaybackState(
  state: StoredMusicPlaybackState,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  try {
    storage.setItem(MUSIC_PLAYBACK_STATE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const minutes = Math.floor(value / 60)
  return `${minutes}:${Math.floor(value % 60).toString().padStart(2, '0')}`
}
