import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './App.css'

const redirectPath = new URLSearchParams(window.location.search).get('p')
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
