import { Disc3, Music2 } from 'lucide-react'
import { MusicControls } from './MusicControls'
import { MusicVisualizer } from './MusicVisualizer'
import { useMusicPlayer } from './useMusicPlayer'
import './music.css'

export function MusicDock() {
  const player = useMusicPlayer()
  const progress = player.duration ? player.currentTime / player.duration : 0
  const accent = player.currentTrack?.accentColor || 'var(--color-primary)'
  return (
    <aside className={player.isPlaying ? 'music-dock is-playing' : 'music-dock'} aria-label="Music box" style={{ '--music-energy': player.energy, '--music-progress': `${progress * 360}deg`, '--music-accent': accent } as React.CSSProperties}>
      <div className="music-dock__disc-wrap" aria-hidden="true">
        <div className="music-dock__progress" />
        <div className="music-dock__disc">{player.currentTrack ? <Disc3 /> : <Music2 />}</div>
      </div>
      <div className="music-dock__body">
        <strong>{player.currentTrack?.title || 'Music box'}</strong>
        <span>{player.currentTrack?.artist || 'QuanWenG'}</span>
        <MusicVisualizer className="music-dock__equalizer" spectrum={player.spectrum} isPlaying={player.isPlaying} />
        <MusicControls compact />
        {player.error && <small role="status">{player.error}</small>}
      </div>
    </aside>
  )
}