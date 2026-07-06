export type GalaxyLayer = 'farDistant' | 'galaxyBand' | 'near'

export interface GalaxyStarFieldConfig {
  count: number
  layer: GalaxyLayer
  radius: number
  seed: number
  warpStrength: number
}

export interface GalaxyNebulaShellConfig {
  colorA: string
  colorB: string
  opacity: number
  radius: number
  scale: number
  seed: number
  speed: number
}

export interface GalaxyQualityProfile {
  bloomRadius: number
  bloomResolutionScale: number
  bloomStrength: number
  bloomThreshold: number
  nebulaShells: readonly GalaxyNebulaShellConfig[]
  postProcessPixelRatio: number
  renderTargetScale: number
  starFields: readonly GalaxyStarFieldConfig[]
}

export const ULTRA_GALAXY_QUALITY: GalaxyQualityProfile = {
  renderTargetScale: 1.35,
  postProcessPixelRatio: 1,
  bloomStrength: 0.36,
  bloomRadius: 0.18,
  bloomResolutionScale: 1,
  bloomThreshold: 1.15,
  starFields: [
    { count: 4200, radius: 31, layer: 'farDistant', seed: 0x1a2b3c, warpStrength: 0.08 },
    { count: 1650, radius: 22, layer: 'galaxyBand', seed: 0x4d5e6f, warpStrength: 0.42 },
    { count: 180, radius: 15, layer: 'near', seed: 0x708192, warpStrength: 0.16 },
  ],
  nebulaShells: [
    { radius: 34, scale: 2.2, speed: 0.006, opacity: 0.34, seed: 1.7, colorA: '#123b53', colorB: '#39235f' },
    { radius: 41, scale: 3.1, speed: -0.004, opacity: 0.24, seed: 7.3, colorA: '#0f4c50', colorB: '#5a3526' },
    { radius: 48, scale: 4.4, speed: 0.0025, opacity: 0.17, seed: 13.1, colorA: '#232d58', colorB: '#6a4827' },
  ],
}

export const GALAXY_DIAGNOSTICS_ENABLED = import.meta.env.VITE_GALAXY_DIAGNOSTICS === 'true'
