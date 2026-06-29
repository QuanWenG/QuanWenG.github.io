import { describe, expect, it } from 'vitest'
import techStackData from '../../data/tech-stack.json'
import type { TechStackItem } from '../../types/content'
import { getTechNodePlacement } from './techGalaxyConfig'

describe('getTechNodePlacement', () => {
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
