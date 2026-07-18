import { useEffect, useRef } from 'react'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { useMediaQuery } from '../common/useMediaQuery'
import './AmbientPixelField.css'

export type AmbientPixelVariant = 'blog' | 'projects' | 'music'

interface AmbientPixelFieldProps {
  variant: AmbientPixelVariant
  accent?: string
}

interface PointerState {
  x: number
  y: number
  targetX: number
  targetY: number
  active: boolean
}

type Rgb = readonly [number, number, number]

const PIXEL_RATIO_CAP = 1.5
const POINTER_RADIUS = 180

const VARIANT_COLORS: Record<AmbientPixelVariant, { light: [Rgb, Rgb]; dark: [Rgb, Rgb] }> = {
  blog: {
    light: [[11, 128, 109], [240, 111, 95]],
    dark: [[101, 213, 193], [255, 149, 135]],
  },
  projects: {
    light: [[57, 123, 246], [217, 164, 65]],
    dark: [[116, 165, 255], [240, 199, 107]],
  },
  music: {
    light: [[122, 92, 230], [240, 111, 95]],
    dark: [[171, 149, 255], [255, 149, 135]],
  },
}

function hash(x: number, y: number, seed: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123
  return value - Math.floor(value)
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

function parseHexColor(value?: string): Rgb | null {
  const match = value?.trim().match(/^#([\da-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16)]
}

function pointerInfluence(pointer: PointerState, x: number, y: number) {
  if (!pointer.active) return 0
  return Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / POINTER_RADIUS)
}

function drawBlogField(context: CanvasRenderingContext2D, width: number, height: number, time: number, pointer: PointerState, colors: [Rgb, Rgb], compact: boolean, staticFrame: boolean) {
  const spacing = compact ? 48 : 36
  const motionTime = staticFrame ? 12 : time * 0.00032

  for (let row = -1; row <= Math.ceil(height / spacing) + 1; row += 1) {
    for (let column = -1; column <= Math.ceil(width / spacing) + 1; column += 1) {
      const seed = hash(column, row, 1.7)
      if (seed < 0.68) continue
      const baseX = column * spacing + (hash(column, row, 2.3) - 0.5) * 18
      const baseY = row * spacing + (hash(column, row, 4.1) - 0.5) * 18
      const driftX = Math.sin(motionTime + seed * 9) * 3
      const driftY = Math.cos(motionTime * 0.8 + seed * 11) * 3
      const influence = pointerInfluence(pointer, baseX, baseY)
      const distance = Math.max(1, Math.hypot(baseX - pointer.x, baseY - pointer.y))
      const repelX = pointer.active ? ((baseX - pointer.x) / distance) * influence * 18 : 0
      const repelY = pointer.active ? ((baseY - pointer.y) / distance) * influence * 18 : 0
      const x = Math.round(baseX + driftX + repelX)
      const y = Math.round(baseY + driftY + repelY)
      const pulse = staticFrame ? 0.5 : Math.sin(time * 0.0015 + seed * 12) * 0.5 + 0.5
      const size = Math.round(2 + seed * 3 + influence * 3)
      const color = seed > 0.9 ? colors[1] : colors[0]

      context.fillStyle = rgba(color, 0.045 + pulse * 0.055 + influence * 0.14)
      context.fillRect(x, y, size, size)

      if (seed > 0.88) {
        context.strokeStyle = rgba(color, 0.025 + influence * 0.06)
        context.lineWidth = 1
        context.beginPath()
        context.moveTo(x + size, y + size * 0.5)
        context.lineTo(x + spacing * (0.42 + seed * 0.24), y + (hash(row, column, 8.2) - 0.5) * spacing)
        context.stroke()
      }
    }
  }
}

function drawProjectField(context: CanvasRenderingContext2D, width: number, height: number, time: number, pointer: PointerState, colors: [Rgb, Rgb], compact: boolean, staticFrame: boolean) {
  const spacing = compact ? 58 : 46
  const travel = staticFrame ? 0.36 : (time * 0.00016) % 1

  for (let row = -1; row <= Math.ceil(height / spacing) + 1; row += 1) {
    for (let column = -1; column <= Math.ceil(width / spacing) + 1; column += 1) {
      const seed = hash(column, row, 12.4)
      if (seed < 0.48) continue
      const x = Math.round(column * spacing + (hash(column, row, 3.8) - 0.5) * 10)
      const y = Math.round(row * spacing + (hash(column, row, 6.3) - 0.5) * 10)
      const influence = pointerInfluence(pointer, x, y)
      const horizontal = hash(column, row, 9.9) > 0.42
      const length = spacing * (0.46 + hash(row, column, 5.2) * 0.72)
      const color = seed > 0.82 ? colors[1] : colors[0]

      context.strokeStyle = rgba(color, 0.035 + influence * 0.13)
      context.lineWidth = influence > 0.45 ? 1.5 : 1
      context.beginPath()
      context.moveTo(x, y)
      if (horizontal) {
        context.lineTo(x + length, y)
        if (seed > 0.74) context.lineTo(x + length, y + spacing * 0.35)
      } else {
        context.lineTo(x, y + length)
        if (seed > 0.74) context.lineTo(x + spacing * 0.35, y + length)
      }
      context.stroke()

      const pulsePosition = (travel + seed) % 1
      const pulseX = horizontal ? x + length * pulsePosition : x
      const pulseY = horizontal ? y : y + length * pulsePosition
      const nodeSize = Math.round(2 + influence * 4 + (seed > 0.9 ? 2 : 0))
      context.fillStyle = rgba(color, 0.08 + influence * 0.24)
      context.fillRect(Math.round(x - nodeSize / 2), Math.round(y - nodeSize / 2), nodeSize, nodeSize)
      context.fillStyle = rgba(color, 0.12 + influence * 0.32)
      context.fillRect(Math.round(pulseX), Math.round(pulseY), 3 + Math.round(influence * 2), 3 + Math.round(influence * 2))
    }
  }
}

function drawMusicField(context: CanvasRenderingContext2D, width: number, height: number, time: number, pointer: PointerState, colors: [Rgb, Rgb], compact: boolean, staticFrame: boolean) {
  const spacing = compact ? 28 : 22
  const rows = compact ? 6 : 8
  const motionTime = staticFrame ? 16 : time * 0.00135

  for (let row = 0; row < rows; row += 1) {
    const centerY = height * (0.14 + row * (0.72 / Math.max(1, rows - 1)))
    for (let x = -spacing; x < width + spacing; x += spacing) {
      const seed = hash(x / spacing, row, 21.6)
      if (seed < 0.22) continue
      const baseWave = Math.sin(x * 0.014 + motionTime * (0.82 + row * 0.055) + row * 0.9) * (10 + row * 2.1)
      const influence = pointerInfluence(pointer, x, centerY + baseWave)
      const rippleDistance = Math.hypot(x - pointer.x, centerY - pointer.y)
      const ripple = pointer.active ? Math.sin(rippleDistance * 0.055 - motionTime * 4.2) * influence * 22 : 0
      const y = Math.round(centerY + baseWave + ripple)
      const energy = Math.sin(motionTime * 1.8 + x * 0.022 + row) * 0.5 + 0.5
      const size = Math.round(2 + energy * 4 + influence * 4)
      const color = row % 3 === 0 ? colors[1] : colors[0]
      context.fillStyle = rgba(color, 0.035 + energy * 0.07 + influence * 0.16)
      context.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size)
    }
  }
}

export function AmbientPixelField({ variant, accent }: AmbientPixelFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduceMotion = useMediaQuery(MEDIA_QUERIES.reducedMotion)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    if (!context) return undefined

    let width = 0
    let height = 0
    let animationId = 0
    const pointer: PointerState = { x: 0, y: 0, targetX: 0, targetY: 0, active: false }

    const colorsForTheme = () => {
      const dark = document.documentElement.dataset.theme === 'dark'
      const palette = VARIANT_COLORS[variant][dark ? 'dark' : 'light']
      const customAccent = variant === 'music' ? parseHexColor(accent) : null
      return [customAccent || palette[0], palette[1]] as [Rgb, Rgb]
    }

    const draw = (time: number) => {
      pointer.x += (pointer.targetX - pointer.x) * 0.14
      pointer.y += (pointer.targetY - pointer.y) * 0.14
      context.clearRect(0, 0, width, height)
      const colors = colorsForTheme()
      const compact = width < 720
      const glowX = pointer.active ? pointer.x : width * 0.52
      const glowY = pointer.active ? pointer.y : height * 0.42
      const glow = context.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(width, height) * 0.58)
      glow.addColorStop(0, rgba(colors[0], pointer.active ? 0.07 : 0.045))
      glow.addColorStop(0.52, rgba(colors[1], 0.022))
      glow.addColorStop(1, rgba(colors[0], 0))
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      if (variant === 'blog') drawBlogField(context, width, height, time, pointer, colors, compact, reduceMotion)
      else if (variant === 'projects') drawProjectField(context, width, height, time, pointer, colors, compact, reduceMotion)
      else drawMusicField(context, width, height, time, pointer, colors, compact, reduceMotion)
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const ratio = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP)
      canvas.width = Math.max(1, Math.floor(width * ratio))
      canvas.height = Math.max(1, Math.floor(height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      pointer.x = pointer.targetX = width * 0.5
      pointer.y = pointer.targetY = height * 0.5
      draw(performance.now())
    }

    const animate = (time: number) => {
      draw(time)
      animationId = window.requestAnimationFrame(animate)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointer.targetX = event.clientX
      pointer.targetY = event.clientY
      pointer.active = true
    }
    const onPointerLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return
      pointer.active = false
    }
    const onVisibilityChange = () => {
      window.cancelAnimationFrame(animationId)
      animationId = 0
      if (!document.hidden && !reduceMotion) animationId = window.requestAnimationFrame(animate)
    }

    const themeObserver = new MutationObserver(() => draw(performance.now()))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    resize()
    if (!reduceMotion) animationId = window.requestAnimationFrame(animate)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerLeave, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.cancelAnimationFrame(animationId)
      themeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [accent, reduceMotion, variant])

  return <canvas ref={canvasRef} className={`ambient-pixel-field ambient-pixel-field--${variant}`} data-testid={`ambient-pixel-${variant}`} data-variant={variant} aria-hidden="true" />
}