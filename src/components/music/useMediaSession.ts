import { useEffect } from 'react'
import type { MusicTrack } from '../../types/music'
import { resolvePublicAssetPath } from '../../services/publicAssetPath'

export function useMediaSession(currentTrack: MusicTrack | null, controls: {
  play: () => void
  pause: () => void
  previous: () => void
  next: () => void
}) {
  const { play, pause, previous, next } = controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.cover ? [{ src: resolvePublicAssetPath(currentTrack.cover) }] : [],
    })
    navigator.mediaSession.setActionHandler('play', play)
    navigator.mediaSession.setActionHandler('pause', pause)
    navigator.mediaSession.setActionHandler('previoustrack', previous)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [currentTrack, next, pause, play, previous])
}