import type { TechStackItem, TechTier } from '../../types/content'

export type GalaxyLayer = 'farDistant' | 'galaxyDisk'

export const STAR_CENTER_CLEAR_RADIUS: Record<GalaxyLayer, number> = {
  farDistant: 7.2,
  galaxyDisk: 12.4,
}
export const TECH_TOOLTIP_Z_INDEX_RANGE: [number, number] = [80, 60]
export const BLACK_HOLE_OCCLUDER_RADIUS = 0.68

export const TECH_GALAXY_CANVAS_CONFIG = {
  background: '#01040a',
  camera: { position: [0, 1.4, 10.5] as [number, number, number], fov: 50 },
  dpr: [1, 1.35] as [number, number],
} as const

export const TECH_GALAXY_SCENE_CONFIG = {
  fogNear: 12,
  fogFar: 30,
  ambientLightIntensity: 0.12,
  groupRotation: [0.08, 0, -0.16] as [number, number, number],
  idleRotationSpeed: 0.018,
  renderTargetScale: 1.5,
  blackHoleOccluderSegments: 32,
} as const

export const TECH_GALAXY_STAR_FIELDS = [
  { count: 1050, radius: 19, layer: 'farDistant', warpStrength: 0.14 },
  { count: 560, radius: 18, layer: 'galaxyDisk', warpStrength: 0.48 },
] as const satisfies ReadonlyArray<{
  count: number
  radius: number
  layer: GalaxyLayer
  warpStrength: number
}>

export const TECH_GALAXY_CONTROLS_CONFIG = {
  minDistance: 4,
  maxDistance: 22,
  autoRotateSpeed: 0.12,
  dampingFactor: 0.08,
} as const

const TIER_ORBIT_RADIUS: Record<TechTier, number> = { primary: 6.35, supporting: 7.85, learning: 9.25 }
const TIER_VERTICAL_SPREAD: Record<TechTier, number> = { primary: 1.35, supporting: 2.15, learning: 2.85 }
const TIER_SIZE_SCALE: Record<TechTier, number> = { primary: 3, supporting: 2.65, learning: 2.25 }
const TIER_OFFSET: Record<TechTier, number> = { primary: 0.2, supporting: 0.88, learning: 1.46 }

export function getTechNodePlacement(item: TechStackItem, index: number, total: number) {
  const tier = item.tier ?? 'supporting'
  const tierOffset = TIER_OFFSET[tier]
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + tierOffset
  const radius = item.orbitRadius ?? TIER_ORBIT_RADIUS[tier]
  const size = (item.size ?? 0.22) * TIER_SIZE_SCALE[tier]
  const [biasX = 0, biasY = 0, biasZ = 0] = item.positionBias ?? []

  // 轨道只由内容和层级决定，避免刷新时节点随机换位。
  const position: [number, number, number] = [
    Math.cos(angle) * radius + biasX,
    Math.sin(index * 1.618 + tierOffset) * TIER_VERTICAL_SPREAD[tier] + biasY,
    Math.sin(angle) * radius + biasZ,
  ]
  return { tier, position, size }
}
