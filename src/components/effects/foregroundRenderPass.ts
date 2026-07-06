import type { Camera, Scene, WebGLRenderer } from 'three'

export function renderForegroundLayer({
  camera,
  layer,
  renderer,
  scene,
}: {
  camera: Camera
  layer: number
  renderer: WebGLRenderer
  scene: Scene
}) {
  const previousAutoClear = renderer.autoClear
  const previousBackground = scene.background
  const previousCameraLayerMask = camera.layers.mask

  try {
    camera.layers.set(layer)
    renderer.autoClear = false
    scene.background = null
    renderer.clearDepth()
    renderer.render(scene, camera)
  } finally {
    scene.background = previousBackground
    renderer.autoClear = previousAutoClear
    camera.layers.mask = previousCameraLayerMask
  }
}
