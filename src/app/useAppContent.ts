import { useCallback, useEffect, useState } from 'react'
import type { AppContent, ContentService } from '../services'

export type AppContentState =
  | { status: 'loading'; data: null }
  | { status: 'ready'; data: AppContent }
  | { status: 'error'; data: null }

export function useAppContent(contentService: ContentService) {
  const [state, setState] = useState<AppContentState>({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', data: null })
    void contentService.loadAppContent().then(
      (data) => {
        if (active) setState({ status: 'ready', data })
      },
      () => {
        if (active) setState({ status: 'error', data: null })
      },
    )
    return () => {
      active = false
    }
  }, [attempt, contentService])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  return { state, retry }
}