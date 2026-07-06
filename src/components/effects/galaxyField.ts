import {
  BufferAttribute,
  BufferGeometry,
  Color,
} from 'three'
import type { GalaxyLayer, GalaxyStarFieldConfig } from './galaxyQuality'

export interface GalaxyStarAttributes {
  brightness: Float32Array
  colors: Float32Array
  layers: Float32Array
  phases: Float32Array
  positions: Float32Array
  sizes: Float32Array
  speeds: Float32Array
}

export function createSeededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function normalish(random: () => number) {
  return (random() + random() + random() + random() - 2) * 0.5
}

function spectralColor(random: () => number, brightness: number) {
  const roll = random()
  const color = roll < 0.12
    ? new Color('#ffd6ac')
    : roll < 0.32
      ? new Color('#fff0d0')
      : roll < 0.88
        ? new Color('#f5f8ff')
        : new Color('#c8ddff')
  return color.multiplyScalar(0.54 + brightness * 0.72)
}

function createPosition(layer: GalaxyLayer, radius: number, random: () => number) {
  if (layer === 'galaxyBand') {
    const arm = Math.floor(random() * 3)
    const radial = 7.8 + Math.pow(random(), 0.62) * Math.max(radius - 7.8, 1)
    const angle = random() * Math.PI * 2 + arm * Math.PI * (2 / 3) + radial * 0.34
    return [
      Math.cos(angle) * radial + normalish(random) * 2.8,
      normalish(random) * (0.32 + radial * 0.025),
      Math.sin(angle) * radial + normalish(random) * 2.8,
    ] as const
  }

  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const minimum = layer === 'near' ? 10.5 : radius * 0.72
  const distance = minimum + Math.pow(random(), layer === 'near' ? 0.7 : 1.2) * (radius - minimum)
  const verticalScale = layer === 'farDistant' ? 0.78 : 1
  return [
    Math.sin(phi) * Math.cos(theta) * distance,
    Math.cos(phi) * distance * verticalScale,
    Math.sin(phi) * Math.sin(theta) * distance,
  ] as const
}

export function createGalaxyStarAttributes(config: GalaxyStarFieldConfig): GalaxyStarAttributes {
  const random = createSeededRandom(config.seed)
  const positions = new Float32Array(config.count * 3)
  const colors = new Float32Array(config.count * 3)
  const sizes = new Float32Array(config.count)
  const phases = new Float32Array(config.count)
  const speeds = new Float32Array(config.count)
  const layers = new Float32Array(config.count)
  const brightness = new Float32Array(config.count)
  const layerValue = config.layer === 'farDistant' ? 0 : config.layer === 'galaxyBand' ? 0.5 : 1

  for (let index = 0; index < config.count; index += 1) {
    const stride = index * 3
    const position = createPosition(config.layer, config.radius, random)
    const rareBright = random()
    const luminance = rareBright > 0.98
      ? 0.98 + random() * 0.02
      : 0.1 + Math.pow(random(), 5.5) * 0.76
    const color = spectralColor(random, luminance)
    positions.set(position, stride)
    colors.set([color.r, color.g, color.b], stride)
    brightness[index] = luminance
    sizes[index] = config.layer === 'near'
      ? 2.4 + luminance * 6.4
      : config.layer === 'galaxyBand'
        ? 1.1 + luminance * 4.2
        : 0.65 + luminance * 3.1
    phases[index] = random() * Math.PI * 2
    speeds[index] = config.layer === 'farDistant' ? 0.008 + random() * 0.012 : 0.025 + random() * 0.08
    layers[index] = layerValue
  }

  return { brightness, colors, layers, phases, positions, sizes, speeds }
}

export function createGalaxyStarGeometry(config: GalaxyStarFieldConfig) {
  const attributes = createGalaxyStarAttributes(config)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(attributes.positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(attributes.colors, 3))
  geometry.setAttribute('aSize', new BufferAttribute(attributes.sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(attributes.phases, 1))
  geometry.setAttribute('aOrbitSpeed', new BufferAttribute(attributes.speeds, 1))
  geometry.setAttribute('aLayer', new BufferAttribute(attributes.layers, 1))
  geometry.setAttribute('aBrightness', new BufferAttribute(attributes.brightness, 1))
  geometry.computeBoundingSphere()
  return geometry
}
