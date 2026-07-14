import type { ReactNode } from 'react'
import { MusicProvider } from '../../components/music/MusicProvider'
import type { AppContent, ContentService } from '../../services'
import { useContentWorkspace } from './contentWorkspaceContext'
import { ContentWorkspaceProvider } from './ContentWorkspaceProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { ThemeSync } from './ThemeSync'

function WorkspaceMusicProvider({ children }: { children: ReactNode }) {
  const { content } = useContentWorkspace()
  return <MusicProvider tracks={content.musicTracks}>{children}</MusicProvider>
}

export function AppProviders({ children, initialContent, contentService }: { children: ReactNode; initialContent: AppContent; contentService: ContentService }) {
  return <PreferencesProvider><ThemeSync><ContentWorkspaceProvider initialContent={initialContent} contentService={contentService}><WorkspaceMusicProvider>{children}</WorkspaceMusicProvider></ContentWorkspaceProvider></ThemeSync></PreferencesProvider>
}