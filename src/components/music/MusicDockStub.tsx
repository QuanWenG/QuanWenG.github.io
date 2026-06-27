import { Music2 } from 'lucide-react'

export function MusicDockStub() {
  return (
    <aside className="music-dock-stub" aria-label="Music box placeholder">
      <div className="music-dock-stub__disc">
        <Music2 size={18} aria-hidden="true" />
      </div>
      <span>Music box</span>
    </aside>
  )
}
