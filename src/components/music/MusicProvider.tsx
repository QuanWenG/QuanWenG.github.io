import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MusicTrack } from '../../types/music'
import { MusicContext, type RepeatMode } from './musicContext'
import { initialVolume, MUSIC_VOLUME_KEY } from './musicUtils'

function resolveMediaPath(src: string) {
  if (/^(https?:|data:|blob:)/.test(src)) return src
  return `${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`
}

export function MusicProvider({ tracks, children }: { tracks: MusicTrack[]; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const autoplayRef = useRef(false)
  const frameRef = useRef(0)
  const [currentId, setCurrentId] = useState<string | null>(tracks[0]?.id || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(tracks[0]?.duration || 0)
  const [volume, setVolumeState] = useState(initialVolume)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')
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

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    try {
      setError(null)
      await ensureAudioGraph()
      await audio.play()
    } catch {
      setError('Unable to play this track.')
      setIsPlaying(false)
    }
  }, [currentTrack, ensureAudioGraph])

  const next = useCallback(() => {
    if (!tracks.length) return
    autoplayRef.current = isPlaying
    setCurrentId(tracks[(Math.max(currentIndex, 0) + 1) % tracks.length].id)
  }, [currentIndex, isPlaying, tracks])

  const previous = useCallback(() => {
    if (!tracks.length) return
    autoplayRef.current = isPlaying
    setCurrentId(tracks[(Math.max(currentIndex, 0) - 1 + tracks.length) % tracks.length].id)
  }, [currentIndex, isPlaying, tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    audio.src = resolveMediaPath(currentTrack.src)
    audio.load()
    setCurrentTime(0)
    setDuration(currentTrack.duration || 0)
    if (autoplayRef.current) {
      autoplayRef.current = false
      void play()
    }
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
        void play()
      } else {
        autoplayRef.current = true
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
    navigator.mediaSession.setActionHandler('play', () => void play())
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause())
    navigator.mediaSession.setActionHandler('previoustrack', previous)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [currentTrack, next, play, previous])

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
      if (id === currentTrack?.id) {
        void play()
      } else {
        autoplayRef.current = true
        setCurrentId(id)
      }
    },
    togglePlay: () => isPlaying ? audioRef.current?.pause() : void play(),
    previous,
    next,
    seek: (time: number) => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(time, duration || 0))
    },
    setVolume: (nextVolume: number) => {
      const normalized = Math.max(0, Math.min(nextVolume, 1))
      if (audioRef.current) audioRef.current.volume = normalized
      window.localStorage.setItem(MUSIC_VOLUME_KEY, String(normalized))
      setVolumeState(normalized)
    },
    toggleRepeat: () => setRepeatMode((mode) => mode === 'all' ? 'one' : 'all'),
  }), [currentTime, currentTrack, duration, energy, error, isPlaying, next, play, previous, repeatMode, spectrum, tracks, volume])

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}