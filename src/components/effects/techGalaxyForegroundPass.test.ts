import { Color, PerspectiveCamera, Scene, type WebGLRenderer } from 'three'
import { describe, expect, it } from 'vitest'
import { renderForegroundLayer } from './foregroundRenderPass'

describe('technology node foreground render pass', () => {
  it('draws without clearing the composite and restores renderer state', () => {
    const background = new Color('#01040a')
    const scene = new Scene()
    scene.background = background
    const camera = new PerspectiveCamera()
    camera.layers.mask = 5
    const calls: string[] = []
    const renderer = {
      autoClear: true,
      clearDepth() {
        calls.push('clearDepth')
      },
      render(
        this: { autoClear: boolean },
        renderedScene: Scene,
        renderedCamera: PerspectiveCamera,
      ) {
        expect(renderedScene.background).toBeNull()
        expect(renderedCamera.layers.mask).toBe(2)
        expect(this.autoClear).toBe(false)
        calls.push('render')
      },
    } as unknown as WebGLRenderer

    renderForegroundLayer({
      camera,
      layer: 1,
      renderer,
      scene,
    })

    expect(calls).toEqual(['clearDepth', 'render'])
    expect(scene.background).toBe(background)
    expect(renderer.autoClear).toBe(true)
    expect(camera.layers.mask).toBe(5)
  })
})
