import { Disc3, Pause, Play } from 'lucide-react'
import { usePreferences } from '../../app/providers/usePreferences'
import { MusicControls } from '../../components/music/MusicControls'
import { formatTime } from '../../components/music/musicUtils'
import { useMusicPlayer } from '../../components/music/useMusicPlayer'
import { textByLocale } from '../../services/i18n'
import type { UiCopy } from '../../types/content'
import './MusicPage.css'

export function MusicPage({ ui }: { ui: UiCopy }) {
  const { locale } = usePreferences()
  const player = useMusicPlayer()
  return (
    <section className="content-page music-page" aria-labelledby="music-title">
      <header className="content-page__header">
        <p>PLAYLIST / AUDIO</p>
        <h1 id="music-title">{textByLocale(ui['music.title'], locale)}</h1>
        <span>{textByLocale(ui['music.subtitle'], locale)}</span>
      </header>
      {player.tracks.length ? (
        <div className="music-page__layout">
          <div className="music-page__now" style={{ '--track-accent': player.currentTrack?.accentColor } as React.CSSProperties}>
            <div className={player.isPlaying ? 'music-page__vinyl is-spinning' : 'music-page__vinyl'}><Disc3 /></div>
            <div><small>NOW PLAYING</small><h2>{player.currentTrack?.title}</h2><p>{player.currentTrack?.artist}</p></div>
            <MusicControls />
          </div>
          <ol className="track-list">
            {player.tracks.map((track, index) => {
              const active = track.id === player.currentTrack?.id
              return <li key={track.id} className={active ? 'is-active' : undefined}>
                <button type="button" onClick={() => active ? player.togglePlay() : player.playTrack(track.id)} aria-label={`${active && player.isPlaying ? 'Pause' : 'Play'} ${track.title}`}>
                  <span className="track-list__index">{active && player.isPlaying ? <Pause /> : active ? <Play /> : String(index + 1).padStart(2, '0')}</span>
                  <span><strong>{track.title}</strong><small>{track.artist} · {track.tags.join(' / ')}</small></span>
                  <time>{track.duration ? formatTime(track.duration) : '—:—'}</time>
                </button>
              </li>
            })}
          </ol>
        </div>
      ) : <p className="empty-state">{textByLocale(ui['music.empty'], locale)}</p>}
    </section>
  )
}