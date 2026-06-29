import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { resolvePublicAssetPath } from '../../services/publicAssetPath'
import type { MusicTrack } from '../../types/music'
import type { MusicContextValue } from './musicContext'
import { musicPlayerReducer } from './musicPlayerReducer'
import { initialVolume, readMusicPlaybackState } from './musicUtils'
import { MUSIC_ANALYSER_CONFIG, MUSIC_PLAYBACK_CONFIG } from './musicConfig'
import { useMediaSession } from './useMediaSession'
import { usePlaybackPersistence } from './usePlaybackPersistence'

function isAutoplayBlock(error: unknown) {
  return error instanceof DOMException && error.name === 'NotAllowedError'
}

export function useMusicController(tracks: MusicTrack[]): MusicContextValue {
  const restoredStateRef = useRef(readMusicPlaybackState())
  const initialVolumeRef = useRef(initialVolume())
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
  const [state, dispatch] = useReducer(musicPlayerReducer, {
    currentId: restoredTrackId,
    isPlaying: false,
    currentTime: restoredTimeRef.current,
    duration: tracks.find((track) => track.id === restoredTrackId)?.duration || 0,
    volume: initialVolumeRef.current,
    repeatMode: restoredState?.repeatMode || 'all',
    energy: 0,
    spectrum: [0, 0, 0, 0, 0],
    error: null,
  })

  const currentTrack = tracks.find((track) => track.id === state.currentId) || tracks[0] || null
  const currentIndex = currentTrack ? tracks.findIndex((track) => track.id === currentTrack.id) : -1

  if (!audioRef.current && typeof Audio !== 'undefined') {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.volume = state.volume
    audioRef.current = audio
  }

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || typeof window.AudioContext === 'undefined') return
    if (!audioContextRef.current) {
      // MediaElementSource 只能为同一 audio 创建一次，因此图谱与元素共享完整 Provider 生命周期。
      const context = new window.AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = MUSIC_ANALYSER_CONFIG.fftSize
      analyser.smoothingTimeConstant = MUSIC_ANALYSER_CONFIG.smoothingTimeConstant
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
      dispatch({ type: 'errorChanged', error: null })
      if (fromUserGesture) await ensureAudioGraph()
      await audio.play()
    } catch (playError) {
      if (!isAutoplayBlock(playError)) dispatch({ type: 'errorChanged', error: 'Unable to play this track.' })
      dispatch({ type: 'playbackChanged', isPlaying: false })
    }
  }, [currentTrack, ensureAudioGraph])

  const pause = useCallback(() => {
    playIntentRef.current = false
    audioRef.current?.pause()
  }, [])

  const selectTrack = useCallback((id: string, currentTime = 0) => {
    const duration = tracks.find((track) => track.id === id)?.duration || 0
    dispatch({ type: 'trackChanged', currentId: id, currentTime, duration })
  }, [tracks])

  const next = useCallback(() => {
    if (!tracks.length) return
    restoredTimeRef.current = 0
    selectTrack(tracks[(Math.max(currentIndex, 0) + 1) % tracks.length].id)
  }, [currentIndex, selectTrack, tracks])

  const previous = useCallback(() => {
    if (!tracks.length) return
    restoredTimeRef.current = 0
    selectTrack(tracks[(Math.max(currentIndex, 0) - 1 + tracks.length) % tracks.length].id)
  }, [currentIndex, selectTrack, tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    let restored = false
    const restoreAndMaybePlay = () => {
      if (restored) return
      restored = true
      const savedTime = restoredTimeRef.current
      const upperBound = Number.isFinite(audio.duration) ? Math.max(0, audio.duration - MUSIC_PLAYBACK_CONFIG.metadataEndEpsilonSeconds) : savedTime
      const nextTime = Math.min(savedTime, upperBound)
      if (nextTime > 0) audio.currentTime = nextTime
      dispatch({ type: 'timeChanged', currentTime: nextTime })
      restoredTimeRef.current = 0
      if (playIntentRef.current) void play(false)
    }

    audio.pause()
    audio.src = resolvePublicAssetPath(currentTrack.src)
    dispatch({
      type: 'trackChanged',
      currentId: currentTrack.id,
      currentTime: restoredTimeRef.current,
      duration: currentTrack.duration || 0,
    })
    audio.addEventListener('loadedmetadata', restoreAndMaybePlay, { once: true })
    audio.load()
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) restoreAndMaybePlay()

    return () => audio.removeEventListener('loadedmetadata', restoreAndMaybePlay)
  }, [currentTrack, play])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => dispatch({ type: 'timeChanged', currentTime: audio.currentTime || 0 })
    const updateDuration = () => dispatch({ type: 'durationChanged', duration: Number.isFinite(audio.duration) ? audio.duration : 0 })
    const onPlay = () => dispatch({ type: 'playbackChanged', isPlaying: true })
    const onPause = () => dispatch({ type: 'playbackChanged', isPlaying: false })
    const onError = () => dispatch({ type: 'errorChanged', error: 'Audio resource could not be loaded.' })
    const onEnded = () => {
      if (state.repeatMode === 'one') {
        audio.currentTime = 0
        void play(false)
      } else {
        playIntentRef.current = true
        restoredTimeRef.current = 0
        const index = tracks.findIndex((track) => track.id === state.currentId)
        const nextTrack = tracks[(Math.max(index, 0) + 1) % Math.max(tracks.length, 1)]
        if (nextTrack) selectTrack(nextTrack.id)
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
  }, [play, selectTrack, state.currentId, state.repeatMode, tracks])

  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current
      if (!audio) return
      // 浏览器阻止无交互自动播放时，首次手势恢复播放意图并解锁 AudioContext。
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

  usePlaybackPersistence({
    currentId: state.currentId,
    currentTime: state.currentTime,
    repeatMode: state.repeatMode,
    isPlaying: state.isPlaying,
    playIntentRef,
    audioRef,
  })

  useEffect(() => {
    if (!state.isPlaying || !analyserRef.current) {
      dispatch({ type: 'visualizationChanged', energy: 0, spectrum: [0, 0, 0, 0, 0] })
      return
    }
    const analyser = analyserRef.current
    const values = new Uint8Array(analyser.frequencyBinCount)
    const ranges = MUSIC_ANALYSER_CONFIG.frequencyRanges
    let lastUpdate = 0
    const tick = (time: number) => {
      analyser.getByteFrequencyData(values)
      if (time - lastUpdate > MUSIC_ANALYSER_CONFIG.updateIntervalMs) {
        const spectrum = ranges.map(([start, end]) => {
          let sum = 0
          const safeEnd = Math.min(end, values.length)
          for (let index = start; index < safeEnd; index += 1) sum += values[index]
          return Math.min(1, (sum / Math.max((safeEnd - start) * 255, 1)) * MUSIC_ANALYSER_CONFIG.levelBoost)
        })
        dispatch({
          type: 'visualizationChanged',
          spectrum,
          energy: spectrum.reduce((sum, value) => sum + value, 0) / spectrum.length,
        })
        lastUpdate = time
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [state.isPlaying])

  const mediaPlay = useCallback(() => { void play(true) }, [play])
  useMediaSession(currentTrack, { play: mediaPlay, pause, previous, next })

  useEffect(() => () => {
    audioRef.current?.pause()
    if (audioContextRef.current) void audioContextRef.current.close()
  }, [])

  return useMemo(() => ({
    tracks,
    currentTrack,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    repeatMode: state.repeatMode,
    energy: state.energy,
    spectrum: state.spectrum,
    error: state.error,
    playTrack: (id: string) => {
      playIntentRef.current = true
      if (id === currentTrack?.id) void play(true)
      else {
        restoredTimeRef.current = 0
        selectTrack(id)
      }
    },
    togglePlay: () => state.isPlaying ? pause() : void play(true),
    previous,
    next,
    seek: (time: number) => {
      const nextTime = Math.max(0, Math.min(time, state.duration || 0))
      if (audioRef.current) audioRef.current.currentTime = nextTime
      dispatch({ type: 'timeChanged', currentTime: nextTime })
    },
    setVolume: (volume: number) => {
      const normalized = Math.max(0, Math.min(volume, 1))
      if (audioRef.current) audioRef.current.volume = normalized
      try { window.localStorage.setItem(STORAGE_KEYS.musicVolume, String(normalized)) } catch { /* 浏览器可能禁用存储。 */ }
      dispatch({ type: 'volumeChanged', volume: normalized })
    },
    toggleRepeat: () => dispatch({ type: 'repeatChanged', repeatMode: state.repeatMode === 'all' ? 'one' : 'all' }),
  }), [currentTrack, next, pause, play, previous, selectTrack, state, tracks])
}