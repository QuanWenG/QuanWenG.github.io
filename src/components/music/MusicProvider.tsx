import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MusicTrack } from '../../types/music'
import { MusicContext, type RepeatMode } from './musicContext'
import {
  initialVolume,
  MUSIC_VOLUME_KEY,
  readMusicPlaybackState,
  writeMusicPlaybackState,
} from './musicUtils'

function resolveMediaPath(src: string) {
  if (/^(https?:|data:|blob:)/.test(src)) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

function isAutoplayBlock(error: unknown) {
  return error instanceof DOMException && error.name === 'NotAllowedError'
}

export function MusicProvider({ tracks, children }: { tracks: MusicTrack[]; children: ReactNode }) {
  const restoredStateRef = useRef(readMusicPlaybackState())
  const restoredState = restoredStateRef.current
  const restoredTrackId = restoredState?.currentId && tracks.some((track) => track.id === restoredState.currentId)
    ? restoredState.currentId
    : tracks[0]?.id || null
  const restoredTimeRef = useRef(restoredTrackId === restoredState?.currentId ? restoredState?.currentTime || 0 : 0)
  const playIntentRef = useRef(restoredState?.wasPlaying ?? true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef(0)
  const [currentId, setCurrentId] = useState<string | null>(restoredTrackId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(restoredTimeRef.current)
  const [duration, setDuration] = useState(tracks.find((track) => track.id === restoredTrackId)?.duration || 0)
  const [volume, setVolumeState] = useState(initialVolume)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(restoredState?.repeatMode || 'all')
  const [energy, setEnergy] = useState(0)
  const [spectrum, setSpectrum] = useState([0, 0, 0, 0, 0])
  const [error, setError] = useState<string | null>(null)

  const currentTrack = tracks.find((track) => track.id === currentId) || tracks[0] || null
  const currentIndex = currentTrack ? tracks.findIndex((track) => track.id === currentTrack.id) : -1

  if (!audioRef.current && typeof Audio !== 'undefined') {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.volume = volume
    audioRef.current = audio
  }

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || typeof window.AudioContext === 'undefined') return
    if (!audioContextRef.current) {
      const context = new window.AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.82
      context.createMediaElementSource(audio).connect(analyser)
      analyser.connect(context.destination)
      audioContextRef.current = context
      analyserRef.current = analyser
    }
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
  }, [])

  const play = useCallback(async (fromUserGesture = true) => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    playIntentRef.current = true
    try {
      setError(null)
      if (fromUserGesture) await ensureAudioGraph()
      await audio.play()
    } catch (playError) {
      if (!isAutoplayBlock(playError)) setError('Unable to play this track.')
      setIsPlaying(false)
    }
  }, [currentTrack, ensureAudioGraph])

  const pause = useCallback(() => {
    playIntentRef.current = false
    audioRef.current?.pause()
  }, [])

  const next = useCallback(() => {
    if (!tracks.length) return
    restoredTimeRef.current = 0
    setCurrentId(tracks[(Math.max(currentIndex, 0) + 1) % tracks.length].id)
  }, [currentIndex, tracks])

  const previous = useCallback(() => {
    if (!tracks.length) return
    restoredTimeRef.current = 0
    setCurrentId(tracks[(Math.max(currentIndex, 0) - 1 + tracks.length) % tracks.length].id)
  }, [currentIndex, tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    let restored = false
    const restoreAndMaybePlay = () => {
      if (restored) return
      restored = true
      const savedTime = restoredTimeRef.current
      const upperBound = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.25) : savedTime
      const nextTime = Math.min(savedTime, upperBound)
      if (nextTime > 0) audio.currentTime = nextTime
      setCurrentTime(nextTime)
      restoredTimeRef.current = 0
      if (playIntentRef.current) void play(false)
    }

    audio.pause()
    audio.src = resolveMediaPath(currentTrack.src)
    setCurrentTime(restoredTimeRef.current)
    setDuration(currentTrack.duration || 0)
    audio.addEventListener('loadedmetadata', restoreAndMaybePlay, { once: true })
    audio.load()
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) restoreAndMaybePlay()

    return () => audio.removeEventListener('loadedmetadata', restoreAndMaybePlay)
  }, [currentTrack, play])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime || 0)
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onError = () => setError('Audio resource could not be loaded.')
    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0
        void play(false)
      } else {
        playIntentRef.current = true
        restoredTimeRef.current = 0
        setCurrentId((id) => {
          const index = tracks.findIndex((track) => track.id === id)
          return tracks[(Math.max(index, 0) + 1) % Math.max(tracks.length, 1)]?.id || null
        })
      }
    }
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('ended', onEnded)
    }
  }, [play, repeatMode, tracks])

  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current
      if (!audio) return
      if (playIntentRef.current && audio.paused) void play(true)
      else void ensureAudioGraph()
    }
    window.addEventListener('pointerdown', unlockAudio, { capture: true, once: true })
    window.addEventListener('keydown', unlockAudio, { capture: true, once: true })
    window.addEventListener('touchstart', unlockAudio, { capture: true, once: true })
    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true)
      window.removeEventListener('keydown', unlockAudio, true)
      window.removeEventListener('touchstart', unlockAudio, true)
    }
  }, [ensureAudioGraph, play])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeMusicPlaybackState({ currentId, currentTime, repeatMode, wasPlaying: playIntentRef.current })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [currentId, currentTime, isPlaying, repeatMode])

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
  }, [currentId, currentTime, repeatMode])

  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      setEnergy(0)
      setSpectrum([0, 0, 0, 0, 0])
      return
    }
    const analyser = analyserRef.current
    const values = new Uint8Array(analyser.frequencyBinCount)
    const ranges: Array<[number, number]> = [[1, 4], [4, 8], [8, 14], [14, 22], [22, 34]]
    let lastUpdate = 0
    const tick = (time: number) => {
      analyser.getByteFrequencyData(values)
      if (time - lastUpdate > 48) {
        const nextSpectrum = ranges.map(([start, end]) => {
          let sum = 0
          const safeEnd = Math.min(end, values.length)
          for (let index = start; index < safeEnd; index += 1) sum += values[index]
          const level = sum / Math.max((safeEnd - start) * 255, 1)
          return Math.min(1, level * 1.8)
        })
        setSpectrum(nextSpectrum)
        setEnergy(nextSpectrum.reduce((sum, value) => sum + value, 0) / nextSpectrum.length)
        lastUpdate = time
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.cover ? [{ src: resolveMediaPath(currentTrack.cover) }] : [],
    })
    navigator.mediaSession.setActionHandler('play', () => void play(true))
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

  useEffect(() => () => {
    audioRef.current?.pause()
    if (audioContextRef.current) void audioContextRef.current.close()
  }, [])

  const value = useMemo(() => ({
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    energy,
    spectrum,
    error,
    playTrack: (id: string) => {
      playIntentRef.current = true
      if (id === currentTrack?.id) {
        void play(true)
      } else {
        restoredTimeRef.current = 0
        setCurrentId(id)
      }
    },
    togglePlay: () => isPlaying ? pause() : void play(true),
    previous,
    next,
    seek: (time: number) => {
      const nextTime = Math.max(0, Math.min(time, duration || 0))
      if (audioRef.current) audioRef.current.currentTime = nextTime
      setCurrentTime(nextTime)
    },
    setVolume: (nextVolume: number) => {
      const normalized = Math.max(0, Math.min(nextVolume, 1))
      if (audioRef.current) audioRef.current.volume = normalized
      window.localStorage.setItem(MUSIC_VOLUME_KEY, String(normalized))
      setVolumeState(normalized)
    },
    toggleRepeat: () => setRepeatMode((mode) => mode === 'all' ? 'one' : 'all'),
  }), [currentTime, currentTrack, duration, energy, error, isPlaying, next, pause, play, previous, repeatMode, spectrum, tracks, volume])

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}
