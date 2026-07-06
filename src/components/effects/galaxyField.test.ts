import { describe, expect, it } from 'vitest'
import { createGalaxyStarAttributes, createSeededRandom } from './galaxyField'
import { ULTRA_GALAXY_QUALITY } from './galaxyQuality'

describe('cinematic galaxy field', () => {
  it('produces a deterministic random sequence from the same seed', () => {
    const first = createSeededRandom(42)
    const second = createSeededRandom(42)
    expect(Array.from({ length: 8 }, first)).toEqual(Array.from({ length: 8 }, second))
  })

  it('produces deterministic finite star attributes', () => {
    const config = ULTRA_GALAXY_QUALITY.starFields[1]
    const first = createGalaxyStarAttributes(config)
    const second = createGalaxyStarAttributes(config)
    expect([...first.positions]).toEqual([...second.positions])
    expect([...first.brightness]).toEqual([...second.brightness])
    expect([...first.positions].every(Number.isFinite)).toBe(true)
    expect([...first.sizes].every((value) => Number.isFinite(value) && value > 0)).toBe(true)
  })

  it('reserves diffraction brightness for a small stellar minority', () => {
    const attributes = createGalaxyStarAttributes(ULTRA_GALAXY_QUALITY.starFields[0])
    const brightShare = [...attributes.brightness].filter((value) => value >= 0.975).length / attributes.brightness.length
    expect(brightShare).toBeGreaterThan(0.01)
    expect(brightShare).toBeLessThan(0.04)
  })
})
