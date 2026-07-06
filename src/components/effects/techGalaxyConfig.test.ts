import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import techStackData from '../../data/tech-stack.json'
import type { TechStackItem } from '../../types/content'
import {
  getTechNodePlacement,
  getTechNodeRenderLayer,
  TECH_NODE_BACKGROUND_RENDER_LAYER,
  TECH_NODE_RENDER_LAYER,
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
