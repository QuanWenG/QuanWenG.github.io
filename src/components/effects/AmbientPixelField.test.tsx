import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { AmbientPixelField } from './AmbientPixelField'

function createContextMock() {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    lineWidth: 1,
    strokeStyle: '',
  }
}

const defaultMatchMedia = window.matchMedia
let contextMock: ReturnType<typeof createContextMock>
let scheduledFrame: FrameRequestCallback | undefined

describe('AmbientPixelField', () => {
  beforeEach(() => {
    contextMock = createContextMock()
    scheduledFrame = undefined
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => contextMock as unknown as CanvasRenderingContext2D)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      scheduledFrame = callback
      return 42
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    window.matchMedia = defaultMatchMedia
    vi.restoreAllMocks()
  })

  it('renders each page atmosphere as an inert canvas and starts display-synced drawing', () => {
    render(<>
      <AmbientPixelField variant="blog" />
      <AmbientPixelField variant="projects" />
      <AmbientPixelField variant="music" accent="#8b5cf6" />
    </>)

    expect(screen.getByTestId('ambient-pixel-blog')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('ambient-pixel-projects')).toHaveClass('ambient-pixel-field--projects')
    expect(screen.getByTestId('ambient-pixel-music')).toHaveAttribute('data-variant', 'music')
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3)
  })

  it('redraws after pointer movement without taking pointer events itself', () => {
    render(<AmbientPixelField variant="projects" />)
    const drawsBeforePointer = contextMock.fillRect.mock.calls.length

    act(() => window.dispatchEvent(new MouseEvent('pointermove', { clientX: 180, clientY: 140 })))
    act(() => scheduledFrame?.(100))

    expect(contextMock.fillRect.mock.calls.length).toBeGreaterThan(drawsBeforePointer)
    expect(screen.getByTestId('ambient-pixel-projects')).toHaveStyle({ pointerEvents: 'none' })
  })

  it('draws a static frame when reduced motion is requested', () => {
    window.matchMedia = (query: string) => ({
      matches: query === MEDIA_QUERIES.reducedMotion,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })

    render(<AmbientPixelField variant="music" />)
    expect(contextMock.fillRect).toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('cancels animation work when unmounted', () => {
    const { unmount } = render(<AmbientPixelField variant="blog" />)
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42)
  })
})