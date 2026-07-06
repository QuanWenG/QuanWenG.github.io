import { describe, expect, it } from 'vitest'
import { worldSpaceKerrBlackHoleFragmentShader } from './worldSpaceKerrBlackHoleShader'
import { ULTRA_GALAXY_QUALITY } from './galaxyQuality'
import { cinematicFinalShader } from './postProcessShaders'

describe('cinematic visual tuning', () => {
  it('uses a warm platinum, champagne, and orange-red Doppler palette', () => {
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('platinumPalette')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('paleGold')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('champagne')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('platinum')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('receding * 0.36')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('vec3 ember')
  })

  it('uses narrow bloom without a post-process black-hole mask', () => {
    expect(ULTRA_GALAXY_QUALITY.bloomStrength).toBe(0.36)
    expect(ULTRA_GALAXY_QUALITY.bloomRadius).toBe(0.18)
    expect(ULTRA_GALAXY_QUALITY.bloomThreshold).toBe(1.15)
    expect(cinematicFinalShader.uniforms.uExposure.value).toBe(0.95)
    expect(cinematicFinalShader.uniforms).not.toHaveProperty('uCaptureMask')
    expect(cinematicFinalShader.fragmentShader).not.toContain('uCaptureMask')
    expect(cinematicFinalShader.fragmentShader).not.toContain('capturedCore')
    expect(cinematicFinalShader.fragmentShader).not.toContain('blackHoleMetric')
    expect(cinematicFinalShader.fragmentShader).not.toContain('eventHorizon')
  })
})