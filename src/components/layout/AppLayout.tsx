import { Outlet } from 'react-router-dom'
import type { NavigationItem } from '../../types/content'
import { MusicDockStub } from '../music/MusicDockStub'
import { TopNavigation } from './TopNavigation'

interface AppLayoutProps {
  navigation: NavigationItem[]
}

export function AppLayout({ navigation }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <TopNavigation items={navigation} />
      <main>
        <Outlet />
      </main>
      <MusicDockStub />
    </div>
  )
}
