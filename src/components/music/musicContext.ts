import { createContext } from 'react'
import type { MusicTrack } from '../../types/music'

export type RepeatMode = 'all' | 'one'

export interface MusicPlayerState {
  tracks: MusicTrack[]
  currentTrack: MusicTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeatMode: RepeatMode
  energy: number
  error: string | null
}

export interface MusicContextValue extends MusicPlayerState {
  playTrack: (id: string) => void
  togglePlay: () => void
  previous: () => void
  next: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleRepeat: () => void
}

export const MusicContext = createContext<MusicContextValue | null>(null)