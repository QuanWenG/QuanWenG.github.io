import { useEffect, useRef } from 'react'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { useMediaQuery } from '../common/useMediaQuery'

interface Sparkle {
  x: number
  y: number
  size: number
  alpha: number
  phase: number
}

const cellSize = 17
const sparkleCount = 180

function fract(value: number) {
  return value - Math.floor(value)
}

function smooth(value: number) {
  return value * value * (3 - 2 * value)
}

function hash2(x: number, y: number) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123)
}

function noise2(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = smooth(fract(x))
  const fy = smooth(fract(y))
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  const x1 = a + (b - a) * fx
  const x2 = c + (d - c) * fx
  return x1 + (x2 - x1) * fy
}

function fbm(x: number, y: number) {
  let value = 0
  let amplitude = 0.52
  let frequency = 1

  for (let octave = 0; octave < 5; octave += 1) {
    value += noise2(x * frequency, y * frequency) * amplitude
    frequency *= 2.08
    amplitude *= 0.5
  }

  return value
}

function createSparkles(width: number, height: number) {
  return Array.from({ length: sparkleCount }, (_, index) => {
    const seed = index + 1
    return {
      x: hash2(seed, 2.1) * width,
      y: hash2(seed, 8.7) * height,
      size: 0.6 + hash2(seed, 4.4) * 1.7,
      alpha: 0.1 + hash2(seed, 9.3) * 0.2,
      phase: hash2(seed, 6.2) * Math.PI * 2,
    }
  })
}

export function GridWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduceMotion = useMediaQuery(MEDIA_QUERIES.reducedMotion)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    let frame = 0
    let animationId = 0
    let sparkles: Sparkle[] = []

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(canvas.clientWidth * ratio)
      canvas.height = Math.floor(canvas.clientHeight * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      sparkles = createSparkles(canvas.clientWidth, canvas.clientHeight)
    }

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const time = reduceMotion ? 18 : frame * 0.012
      const rootStyle = getComputedStyle(document.documentElement)
      context.clearRect(0, 0, width, height)
      context.fillStyle = rootStyle.getPropertyValue('--color-bg')
      context.fillRect(0, 0, width, height)

      const gradient = context.createRadialGradient(width * 0.52, height * 0.45, 0, width * 0.52, height * 0.45, Math.max(width, height) * 0.72)
      gradient.addColorStop(0, 'rgba(97, 218, 251, 0.1)')
      gradient.addColorStop(0.42, 'rgba(45, 189, 143, 0.055)')
      gradient.addColorStop(1, 'rgba(79, 140, 255, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      for (let y = -cellSize; y < height + cellSize; y += cellSize) {
        for (let x = -cellSize; x < width + cellSize; x += cellSize) {
          const nx = x / 135
          const ny = y / 135
          const flowA = fbm(nx + time * 0.36, ny - time * 0.18)
          const flowB = fbm(nx * 1.68 - time * 0.12, ny * 1.68 + time * 0.26)
          const current = Math.sin((flowA * 6.2 + flowB * 4.8 + x * 0.004 - y * 0.006) * Math.PI)
          const energy = Math.max(0, current * 0.5 + 0.5)
          const ridge = Math.pow(energy, 2.45)
          const size = 2 + ridge * 10 + flowB * 2.4
          const alpha = 0.045 + ridge * 0.27
          const hue = 150 + flowA * 76 + ridge * 26
          const offsetX = (flowB - 0.5) * 7
          const offsetY = (flowA - 0.5) * 7

          context.fillStyle = `hsla(${hue}, 78%, ${44 + ridge * 18}%, ${alpha})`
          if (ridge > 0.78) {
            context.shadowBlur = 18 * ridge
            context.shadowColor = `hsla(${hue}, 92%, 62%, ${0.24 * ridge})`
          } else {
            context.shadowBlur = 0
          }
          context.fillRect(x + offsetX - size * 0.5, y + offsetY - size * 0.5, size, size)
        }
      }

      context.shadowBlur = 0
      for (const sparkle of sparkles) {
        const pulse = reduceMotion ? 0.65 : Math.sin(time * 2.2 + sparkle.phase) * 0.5 + 0.5
        context.globalAlpha = sparkle.alpha * (0.45 + pulse * 0.7)
        context.fillStyle = '#ffffff'
        context.fillRect(sparkle.x, sparkle.y, sparkle.size, sparkle.size)
      }
      context.globalAlpha = 1

      frame += 1
      if (!reduceMotion) {
        animationId = window.requestAnimationFrame(draw)
      }
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(animationId)
    }
  }, [reduceMotion])

  return <canvas ref={canvasRef} className="grid-wave" aria-hidden="true" />
}
