import { describe, expect, it } from 'vitest'
import { ULTRA_GALAXY_QUALITY } from './galaxyQuality'

describe('ultra galaxy quality profile', () => {
  it('keeps the agreed cinematic rendering profile', () => {
    const stars = ULTRA_GALAXY_QUALITY.starFields.reduce((sum, field) => sum + field.count, 0)
    expect(ULTRA_GALAXY_QUALITY.renderTargetScale).toBe(1.35)
    expect(ULTRA_GALAXY_QUALITY.bloomResolutionScale).toBe(1)
    expect(ULTRA_GALAXY_QUALITY.nebulaShells).toHaveLength(3)
    expect(stars).toBeGreaterThanOrEqual(6000)
    expect(ULTRA_GALAXY_QUALITY.bloomThreshold).toBeGreaterThan(0)
  })
})
