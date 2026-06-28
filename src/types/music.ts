export interface MusicTrack {
  id: string
  title: string
  artist: string
  src: string
  cover: string
  duration?: number
  accentColor: string
  tags: string[]
}