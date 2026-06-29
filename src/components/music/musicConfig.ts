export const MUSIC_ANALYSER_CONFIG = {
  fftSize: 128,
  smoothingTimeConstant: 0.82,
  frequencyRanges: [[1, 4], [4, 8], [8, 14], [14, 22], [22, 34]] as ReadonlyArray<readonly [number, number]>,
  updateIntervalMs: 48,
  levelBoost: 1.8,
} as const

export const MUSIC_PLAYBACK_CONFIG = {
  metadataEndEpsilonSeconds: 0.25,
  persistenceDelayMs: 250,
} as const
