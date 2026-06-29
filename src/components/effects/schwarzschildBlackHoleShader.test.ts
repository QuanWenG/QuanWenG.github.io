import { describe, expect, it } from 'vitest'
import { createPhysicalBlackHoleUniforms, physicalBlackHoleFragmentShader } from './schwarzschildBlackHoleShader'

describe('physical black-hole depth compositing', () => {
  it('provides depth uniforms for foreground geometry and lensed background geometry', () => {
    const uniforms = createPhysicalBlackHoleUniforms()
    expect(uniforms.uSpaceDepth.value).toBeNull()
    expect(uniforms.uBlackHoleDepth.value).toBe(0.5)
    expect(physicalBlackHoleFragmentShader).toContain('texture2D(uSpaceDepth, vUv)')
    expect(physicalBlackHoleFragmentShader).toContain('sceneDepth < uBlackHoleDepth')
    expect(physicalBlackHoleFragmentShader).toContain('warpedDepth < uBlackHoleDepth')
  })
})