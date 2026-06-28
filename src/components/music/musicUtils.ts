export function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const minutes = Math.floor(value / 60)
  return `${minutes}:${Math.floor(value % 60).toString().padStart(2, '0')}`
}