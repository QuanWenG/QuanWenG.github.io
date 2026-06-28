import { useContext } from 'react'
import { MusicContext } from './musicContext'

export function useMusicPlayer() {
  const value = useContext(MusicContext)
  if (!value) throw new Error('useMusicPlayer must be used inside MusicProvider')
  return value
}