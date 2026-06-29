import type { ReactNode } from 'react'
import type { MusicTrack } from '../../types/music'
import { MusicContext } from './musicContext'
import { useMusicController } from './useMusicController'

export function MusicProvider({ tracks, children }: { tracks: MusicTrack[]; children: ReactNode }) {
  const player = useMusicController(tracks)
  return <MusicContext.Provider value={player}>{children}</MusicContext.Provider>
}