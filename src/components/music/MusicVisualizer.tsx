import type { CSSProperties } from 'react'

interface MusicVisualizerProps {
  spectrum: number[]
  isPlaying: boolean
  className?: string
}

export function MusicVisualizer({ spectrum, isPlaying, className = '' }: MusicVisualizerProps) {
  return (
    <div className={`music-equalizer${isPlaying ? ' is-active' : ''}${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} style={{ '--music-band': Math.max(isPlaying ? 0.12 : 0.06, spectrum[index] ?? 0) } as CSSProperties} />
      ))}
    </div>
  )
}