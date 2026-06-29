import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { createContentService, createRemoteDataSource, localDataSource } from './services'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './App.css'

const redirectPath = new URLSearchParams(window.location.search).get('p')
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath)
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const dataSource = apiBaseUrl
  ? createRemoteDataSource({ baseUrl: apiBaseUrl, fallback: localDataSource })
  : localDataSource
const contentService = createContentService(dataSource)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App contentService={contentService} />
  </StrictMode>,
)