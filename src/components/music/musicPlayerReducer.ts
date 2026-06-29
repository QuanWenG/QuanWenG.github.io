import type { RepeatMode } from './musicContext'

export interface MusicPlayerRuntimeState {
  currentId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeatMode: RepeatMode
  energy: number
  spectrum: number[]
  error: string | null
}

export type MusicPlayerAction =
  | { type: 'trackChanged'; currentId: string | null; currentTime: number; duration: number }
  | { type: 'playbackChanged'; isPlaying: boolean }
  | { type: 'timeChanged'; currentTime: number }
  | { type: 'durationChanged'; duration: number }
  | { type: 'volumeChanged'; volume: number }
  | { type: 'repeatChanged'; repeatMode: RepeatMode }
  | { type: 'visualizationChanged'; energy: number; spectrum: number[] }
  | { type: 'errorChanged'; error: string | null }

export function musicPlayerReducer(state: MusicPlayerRuntimeState, action: MusicPlayerAction): MusicPlayerRuntimeState {
  switch (action.type) {
    case 'trackChanged':
      return { ...state, currentId: action.currentId, currentTime: action.currentTime, duration: action.duration }
    case 'playbackChanged':
      return { ...state, isPlaying: action.isPlaying }
    case 'timeChanged':
      return { ...state, currentTime: action.currentTime }
    case 'durationChanged':
      return { ...state, duration: action.duration }
    case 'volumeChanged':
      return { ...state, volume: action.volume }
    case 'repeatChanged':
      return { ...state, repeatMode: action.repeatMode }
    case 'visualizationChanged':
      return { ...state, energy: action.energy, spectrum: action.spectrum }
    case 'errorChanged':
      return { ...state, error: action.error }
  }
}