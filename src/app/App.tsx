import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { PlaceholderPage } from '../pages/PlaceholderPage/PlaceholderPage'
import { dataSource } from '../services'
import type { NavigationItem, SiteConfig, TechStackItem } from '../types/content'
import { AppProviders } from './providers/AppProviders'

interface AppData {
  site: SiteConfig
  navigation: NavigationItem[]
  techStack: TechStackItem[]
}

function LoadingScreen() {
  return (
    <div className="loading-screen" role="status">
      <span />
      Loading QuanWenG...
    </div>
  )
}

function AppRoutes({ data }: { data: AppData }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout navigation={data.navigation} />}>
          <Route index element={<HomePage site={data.site} techStack={data.techStack} />} />
          <Route path="blog" element={<PlaceholderPage pageId="blog" site={data.site} />} />
          <Route path="projects" element={<PlaceholderPage pageId="projects" site={data.site} />} />
          <Route path="music" element={<PlaceholderPage pageId="music" site={data.site} />} />
          <Route path="*" element={<HomePage site={data.site} techStack={data.techStack} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([dataSource.getSiteConfig(), dataSource.getNavigation(), dataSource.getTechStack()]).then(
      ([site, navigation, techStack]) => {
        if (mounted) {
          setData({ site, navigation, techStack })
        }
      },
    )
    return () => {
      mounted = false
    }
  }, [])

  return <AppProviders>{data ? <AppRoutes data={data} /> : <LoadingScreen />}</AppProviders>
}

export default App
