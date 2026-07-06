import { describe, expect, it, vi } from 'vitest'
import { Texture } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { createGalaxyPostProcessing } from './galaxyPostProcessing'
import { ULTRA_GALAXY_QUALITY } from './galaxyQuality'

vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
  EffectComposer: vi.fn(function MockComposer(this: Record<string, unknown>) {
    this.addPass = vi.fn()
    this.setPixelRatio = vi.fn()
    this.setSize = vi.fn()
    this.render = vi.fn()
    this.dispose = vi.fn()
  }),
}))
vi.mock('three/examples/jsm/postprocessing/TexturePass.js', () => ({
  TexturePass: vi.fn(function MockTexturePass(this: Record<string, unknown>) {
    this.dispose = vi.fn()
  }),
}))
vi.mock('three/examples/jsm/postprocessing/ShaderPass.js', () => ({
  ShaderPass: vi.fn(function MockShaderPass(this: Record<string, unknown>) {
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: { set: vi.fn() } },
    }
    this.dispose = vi.fn()
  }),
}))
vi.mock('three/examples/jsm/postprocessing/UnrealBloomPass.js', () => ({
  UnrealBloomPass: vi.fn(function MockBloomPass(this: Record<string, unknown>) {
    this.setSize = vi.fn()
    this.dispose = vi.fn()
  }),
}))

describe('galaxy post-processing lifecycle', () => {
  it('feeds the HDR source texture and disposes owned passes', () => {
    const sourceTexture = new Texture()
    const pipeline = createGalaxyPostProcessing({
      renderer: {} as never,
      sourceTexture,
      width: 1280,
      height: 720,
      profile: ULTRA_GALAXY_QUALITY,
    })
    expect(EffectComposer).toHaveBeenCalled()
    expect(TexturePass).toHaveBeenCalledWith(sourceTexture)
    expect(UnrealBloomPass).toHaveBeenCalled()
    expect(ShaderPass).toHaveBeenCalled()
    pipeline.render(1 / 60, 2)
    pipeline.resize(1920, 1080)
    pipeline.dispose()
    expect(pipeline.composer.dispose).toHaveBeenCalled()
  })
})