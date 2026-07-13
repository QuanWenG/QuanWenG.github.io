import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MusicDock } from './MusicDock'

vi.mock('./MusicControls', () => ({
  MusicControls: () => <div data-testid="music-controls" />,
}))

vi.mock('./MusicVisualizer', () => ({
  MusicVisualizer: () => <div data-testid="music-visualizer" />,
}))

vi.mock('./useMusicPlayer', () => ({
  useMusicPlayer: () => ({
    currentTime: 25,
    currentTrack: { title: 'Evo', artist: 'QuanWenG', accentColor: '#8fffee' },
    duration: 100,
    energy: 0.35,
    error: null,
    isPlaying: true,
    spectrum: [0.2, 0.8, 0.4],
  }),
}))

describe('MusicDock', () => {
  afterEach(cleanup)

  it('dismisses the floating dock when the close button is clicked', () => {
    render(<MusicDock />)
    expect(screen.getByLabelText('Music box')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭音乐盒' }))
    expect(screen.queryByLabelText('Music box')).not.toBeInTheDocument()
  })
})