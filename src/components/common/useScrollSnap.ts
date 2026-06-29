import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const HASH_SCROLL_DELAY_MS = 120

export function useScrollSnap() {
  const location = useLocation()

  useEffect(() => {
    document.documentElement.classList.add('snap-scroll')
    document.body.classList.add('snap-scroll')
    return () => {
      document.documentElement.classList.remove('snap-scroll')
      document.body.classList.remove('snap-scroll')
    }
  }, [])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const targetId = decodeURIComponent(location.hash.slice(1))
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, HASH_SCROLL_DELAY_MS)
  }, [location])
}
