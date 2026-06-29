import { useEffect, type RefObject } from 'react'
import type { RepeatMode } from './musicContext'
import { MUSIC_PLAYBACK_CONFIG } from './musicConfig'
import { writeMusicPlaybackState } from './musicUtils'

export function usePlaybackPersistence({
  currentId,
  currentTime,
  repeatMode,
  isPlaying,
  playIntentRef,
  audioRef,
}: {
  currentId: string | null
  currentTime: number
  repeatMode: RepeatMode
  isPlaying: boolean
  playIntentRef: RefObject<boolean>
  audioRef: RefObject<HTMLAudioElement | null>
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeMusicPlaybackState({ currentId, currentTime, repeatMode, wasPlaying: playIntentRef.current })
    }, MUSIC_PLAYBACK_CONFIG.persistenceDelayMs)
    return () => window.clearTimeout(timer)
  }, [currentId, currentTime, isPlaying, playIntentRef, repeatMode])

  useEffect(() => {
    const saveBeforeLeaving = () => {
      writeMusicPlaybackState({
        currentId,
        currentTime: Number.isFinite(audioRef.current?.currentTime)
          ? audioRef.current?.currentTime || 0
          : currentTime,
        repeatMode,
        wasPlaying: playIntentRef.current,
      })
    }
    window.addEventListener('pagehide', saveBeforeLeaving)
    return () => window.removeEventListener('pagehide', saveBeforeLeaving)
  }, [audioRef, currentId, currentTime, playIntentRef, repeatMode])
}