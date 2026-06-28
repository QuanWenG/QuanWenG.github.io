import { Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { usePreferences } from '../../app/providers/usePreferences'
import { useMusicPlayer } from './useMusicPlayer'
import { formatTime } from './musicUtils'


export function MusicControls({ compact = false }: { compact?: boolean }) {
  const { locale } = usePreferences()
  const player = useMusicPlayer()
  return (
    <div className={compact ? 'music-controls music-controls--compact' : 'music-controls'}>
      <div className="music-controls__transport">
        <button type="button" onClick={player.previous} aria-label={locale === 'zh' ? '上一首' : 'Previous'}><SkipBack /></button>
        <button className="music-controls__play" type="button" onClick={player.togglePlay} aria-label={player.isPlaying ? 'Pause' : 'Play'}>
          {player.isPlaying ? <Pause /> : <Play />}
        </button>
        <button type="button" onClick={player.next} aria-label={locale === 'zh' ? '下一首' : 'Next'}><SkipForward /></button>
        {!compact && <button type="button" onClick={player.toggleRepeat} aria-label="Repeat mode">{player.repeatMode === 'one' ? <Repeat1 /> : <Repeat />}</button>}
      </div>
      {!compact && (
        <>
          <label className="music-controls__timeline">
            <span>{formatTime(player.currentTime)}</span>
            <input type="range" min="0" max={Math.max(player.duration, 1)} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seek(Number(event.target.value))} aria-label="Playback progress" />
            <span>{formatTime(player.duration)}</span>
          </label>
          <label className="music-controls__volume">
            <Volume2 size={17} aria-hidden="true" />
            <input type="range" min="0" max="1" step="0.01" value={player.volume} onChange={(event) => player.setVolume(Number(event.target.value))} aria-label="Volume" />
          </label>
        </>
      )}
    </div>
  )
}