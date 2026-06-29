export const MUSIC_VOLUME_KEY = 'quanweng-music-volume'

export function initialVolume(storage: Pick<Storage, 'getItem'> = window.localStorage) {
  const stored = storage.getItem(MUSIC_VOLUME_KEY)
  if (stored === null) return 1
  const saved = Number(stored)
  return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 1
}
export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const minutes = Math.floor(value / 60)
  return `${minutes}:${Math.floor(value % 60).toString().padStart(2, '0')}`
}