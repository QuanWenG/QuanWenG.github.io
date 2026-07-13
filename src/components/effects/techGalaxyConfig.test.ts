import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import techStackData from '../../data/tech-stack.json'
import type { TechStackItem } from '../../types/content'
import {
  createOrbitalFocusPath,
  getShortestOrbitalAngleDelta,
  getTechNodePlacement,
  getTechNodeRenderLayer,
  TECH_NODE_BACKGROUND_RENDER_LAYER,
  TECH_NODE_RENDER_LAYER,
  sampleOrbitalFocusPath,
} from './techGalaxyConfig'

describe('getTechNodePlacement', () => {
  it('reserves a foreground render layer for interactive technology nodes', () => {
    expect(TECH_NODE_RENDER_LAYER).toBe(1)
  })

  it('places front nodes above the black hole composite and rear nodes behind it', () => {
    const cameraPosition = new Vector3(0, 0, 10)
    expect(getTechNodeRenderLayer(cameraPosition, new Vector3(0, 0, 4))).toBe(
      TECH_NODE_RENDER_LAYER,
    )
    expect(getTechNodeRenderLayer(cameraPosition, new Vector3(0, 0, -4))).toBe(
      TECH_NODE_BACKGROUND_RENDER_LAYER,
    )
  })

  it('is deterministic for the same node and orbit slot', () => {
    const item = (techStackData as TechStackItem[])[0]
    expect(getTechNodePlacement(item, 1, 7)).toEqual(getTechNodePlacement(item, 1, 7))
  })

  it('produces a finite placement for every configured node', () => {
    const items = techStackData as TechStackItem[]
    const placements = items.map((item, index) => getTechNodePlacement(item, index, items.length))
    expect(placements).toHaveLength(items.length)
    expect(placements.every(({ position, size }) => position.every(Number.isFinite) && Number.isFinite(size))).toBe(true)
  })
})
describe('orbital focus path', () => {
  it('uses the shortest angle around the black hole center', () => {
    expect(getShortestOrbitalAngleDelta(Math.PI * 0.95, -Math.PI * 0.95)).toBeCloseTo(Math.PI * 0.1)
    expect(getShortestOrbitalAngleDelta(-Math.PI * 0.95, Math.PI * 0.95)).toBeCloseTo(-Math.PI * 0.1)
  })

  it('keeps sampled camera positions on the same orbital radius', () => {
    const path = createOrbitalFocusPath({
      fromCamera: new Vector3(0, 1.4, 10),
      fromTarget: new Vector3(0, 0, 0),
      minCameraTargetDistance: 0,
      targetCameraYOffset: 0,
      toTarget: new Vector3(8, 2, 0),
    })

    expect(path.angleDelta).toBeCloseTo(-Math.PI / 2)
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const { cameraPosition } = sampleOrbitalFocusPath(path, progress)
      expect(Math.hypot(cameraPosition[0], cameraPosition[2])).toBeCloseTo(path.radius)
    }
  })
})
