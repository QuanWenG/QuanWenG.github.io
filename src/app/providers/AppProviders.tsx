import type { ReactNode } from 'react'
import { MusicProvider } from '../../components/music/MusicProvider'
import type { MusicTrack } from '../../types/music'
import { PreferencesProvider } from './PreferencesProvider'
import { ThemeSync } from './ThemeSync'

export function AppProviders({ children, tracks }: { children: ReactNode; tracks: MusicTrack[] }) {
  return <PreferencesProvider><ThemeSync><MusicProvider tracks={tracks}>{children}</MusicProvider></ThemeSync></PreferencesProvider>
}