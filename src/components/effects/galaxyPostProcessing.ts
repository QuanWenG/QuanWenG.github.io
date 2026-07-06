import {
  HalfFloatType,
  LinearFilter,
  Vector2,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { GalaxyQualityProfile } from './galaxyQuality'
import { cinematicFinalShader } from './postProcessShaders'

export interface GalaxyPostProcessing {
  composer: EffectComposer
  dispose: () => void
  render: (delta: number, elapsedTime: number) => void
  resize: (width: number, height: number) => void
}

export function createGalaxyPostProcessing({
  height,
  profile,
  renderer,
  sourceTexture,
  width,
}: {
  height: number
  profile: GalaxyQualityProfile
  renderer: WebGLRenderer
  sourceTexture: Texture
  width: number
}): GalaxyPostProcessing {
  const target = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    stencilBuffer: false,
    type: HalfFloatType,
  })
  const composer = new EffectComposer(renderer, target)
  composer.setPixelRatio(profile.postProcessPixelRatio)
  composer.setSize(width, height)

  const texturePass = new TexturePass(sourceTexture)
  const bloomPass = new UnrealBloomPass(
    new Vector2(width * 0.5, height * 0.5),
    profile.bloomStrength,
    profile.bloomRadius,
    profile.bloomThreshold,
  )
  const finalPass = new ShaderPass(cinematicFinalShader)
  finalPass.uniforms.uResolution.value.set(width, height)
  composer.addPass(texturePass)
  composer.addPass(bloomPass)
  composer.addPass(finalPass)
  bloomPass.setSize(width * profile.bloomResolutionScale, height * profile.bloomResolutionScale)

  return {
    composer,
    render(delta, elapsedTime) {
      finalPass.uniforms.uTime.value = elapsedTime
      composer.render(delta)
    },
    resize(nextWidth, nextHeight) {
      composer.setSize(nextWidth, nextHeight)
      bloomPass.setSize(
        nextWidth * profile.bloomResolutionScale,
        nextHeight * profile.bloomResolutionScale,
      )
      finalPass.uniforms.uResolution.value.set(nextWidth, nextHeight)
    },
    dispose() {
      bloomPass.dispose()
      texturePass.dispose()
      finalPass.dispose()
      composer.dispose()
    },
  }
}
