import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { APP_ROUTES } from '../config/routes'
import { HomePage } from '../pages/HomePage/HomePage'
import type { ContentService } from '../services'
import { buildContentIndex } from '../services/contentIndex'
import { AppProviders } from './providers/AppProviders'
import { useContentWorkspace } from './providers/contentWorkspaceContext'
import { useAppContent } from './useAppContent'

const BlogPage = lazy(() => import('../pages/BlogPage/BlogPage').then((module) => ({ default: module.BlogPage })))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const MusicPage = lazy(() => import('../pages/MusicPage/MusicPage').then((module) => ({ default: module.MusicPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function LoadingScreen({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return <div className="loading-screen" role="status">{error ? <><strong>内容暂时没有到达 / Content did not arrive</strong><button className="primary-link" type="button" onClick={onRetry}>重试 / Retry</button></> : <><span />Loading QuanWenG...</>}</div>
}

function AppRoutes() {
  const fallback = <LoadingScreen />
  const { content, contentService } = useContentWorkspace()
  const contentIndex = useMemo(() => buildContentIndex(content.blogIndex, content.projects, content.musicTracks, content.techStack), [content.blogIndex, content.musicTracks, content.projects, content.techStack])

  return <BrowserRouter><Suspense fallback={fallback}><Routes><Route element={<AppLayout navigation={content.navigation} ui={content.ui} />}>
    <Route index element={<HomePage site={content.site} navigation={content.navigation} techStack={content.techStack} projects={content.projects} contentIndex={contentIndex} ui={content.ui} />} />
    <Route path={`${APP_ROUTES.blog}/*`} element={<BlogPage ui={content.ui} contentService={contentService} />} />
    <Route path={APP_ROUTES.projects} element={<ProjectsPage ui={content.ui} projects={content.projects} />} />
    <Route path={APP_ROUTES.music} element={<MusicPage ui={content.ui} />} />
    <Route path={APP_ROUTES.profile} element={<ProfilePage />} />
    <Route path="*" element={<NotFoundPage ui={content.ui} />} />
  </Route></Routes></Suspense></BrowserRouter>
}

function App({ contentService }: { contentService: ContentService }) {
  const { state, retry } = useAppContent(contentService)
  if (state.status !== 'ready') return <LoadingScreen error={state.status === 'error'} onRetry={retry} />
  return <AppProviders initialContent={state.data} contentService={contentService}><AppRoutes /></AppProviders>
}

export default App