import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import {
  AdditiveBlending,
  BackSide,
  Color,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  Mesh,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import type { Group } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { TechStackItem } from '../../types/content'
import {
  createWorldSpaceKerrBlackHoleUniforms,
  worldSpaceKerrBlackHoleFragmentShader,
  worldSpaceKerrBlackHoleVertexShader,
} from './worldSpaceKerrBlackHoleShader'
import { cinematicStarFragmentShader, cinematicStarVertexShader } from './cinematicGalaxyShaders'
import { createGalaxyStarGeometry } from './galaxyField'
import { createGalaxyPostProcessing } from './galaxyPostProcessing'
import { renderForegroundLayer } from './foregroundRenderPass'
import {
  GALAXY_DIAGNOSTICS_ENABLED,
  ULTRA_GALAXY_QUALITY,
  type GalaxyNebulaShellConfig,
  type GalaxyStarFieldConfig,
} from './galaxyQuality'
import { nebulaFragmentShader, nebulaVertexShader } from './nebulaShaders'
import { TechBeacon } from './TechBeacon'
import {
  getTechNodePlacement,
  TECH_GALAXY_CANVAS_CONFIG,
  TECH_NODE_RENDER_LAYER,
  TECH_GALAXY_CONTROLS_CONFIG,
  TECH_GALAXY_SCENE_CONFIG,
} from './techGalaxyConfig'

interface DragState {
  direction: MutableRefObject<{ x: number; y: number }>
  intensity: MutableRefObject<number>
}

function CinematicStarField({
  config,
  drag,
  reduceMotion,
}: {
  config: GalaxyStarFieldConfig
  drag: DragState
  reduceMotion: boolean
}) {
  const materialRef = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => createGalaxyStarGeometry(config), [config])

  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(({ clock }) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uDragIntensity.value = drag.intensity.current
    material.uniforms.uDragDirection.value.set(drag.direction.current.x, drag.direction.current.y)
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={cinematicStarVertexShader}
        fragmentShader={cinematicStarFragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
          uMotion: { value: reduceMotion ? 0 : 1 },
          uDragIntensity: { value: 0 },
          uDragDirection: { value: new Vector2(1, 0) },
          uWarpStrength: { value: config.warpStrength },
        }}
      />
    </points>
  )
}

function NebulaShell({ config, index, reduceMotion }: { config: GalaxyNebulaShellConfig; index: number; reduceMotion: boolean }) {
  const materialRef = useRef<ShaderMaterial>(null)
  const groupRef = useRef<Group>(null)
  const colorA = useMemo(() => new Color(config.colorA), [config.colorA])
  const colorB = useMemo(() => new Color(config.colorB), [config.colorB])

  useFrame(({ clock }, delta) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = reduceMotion ? 0 : clock.elapsedTime * config.speed
    if (groupRef.current && !reduceMotion) {
      groupRef.current.rotation.y += delta * config.speed
      groupRef.current.rotation.x += delta * config.speed * 0.22
    }
  })

  return (
    <group ref={groupRef} rotation={[index * 0.47, index * 0.83, index * 0.19]}>
      <mesh>
        <sphereGeometry args={[config.radius, 64, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
          side={BackSide}
          transparent
          depthWrite={false}
          blending={NormalBlending}
          uniforms={{
            uTime: { value: 0 },
            uScale: { value: config.scale },
            uSeed: { value: config.seed },
            uOpacity: { value: config.opacity },
            uColorA: { value: colorA },
            uColorB: { value: colorB },
          }}
        />
      </mesh>
    </group>
  )
}

function OrbitalGuides() {
  const guides = [
    { radius: 6.35, color: '#8fffee', opacity: 0.1, rotation: 0.02 },
    { radius: 7.85, color: '#bba7ff', opacity: 0.075, rotation: 0.1 },
    { radius: 9.25, color: '#ffd77a', opacity: 0.055, rotation: -0.07 },
  ]
  return <>{guides.map((guide) => (
    <mesh key={guide.radius} rotation={[Math.PI * 0.5 + guide.rotation, 0, -0.16]}>
      <ringGeometry args={[guide.radius - 0.012, guide.radius + 0.012, 256]} />
      <meshBasicMaterial color={guide.color} transparent opacity={guide.opacity} depthWrite={false} blending={AdditiveBlending} />
    </mesh>
  ))}</>
}

function reportDiagnostics(delta: number, samples: MutableRefObject<number[]>, warmup: MutableRefObject<number>, canvas: HTMLCanvasElement) {
  if (!GALAXY_DIAGNOSTICS_ENABLED) return
  if (warmup.current < 180) {
    warmup.current += 1
    return
  }
  if (samples.current.length >= 300) return
  samples.current.push(delta * 1000)
  if (samples.current.length !== 300) return
  const sorted = [...samples.current].sort((left, right) => left - right)
  const averageMs = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length
  const host = canvas.closest('.tech-galaxy') as HTMLElement | null
  if (!host) return
  host.dataset.averageFps = (1000 / averageMs).toFixed(1)
  host.dataset.p95FrameMs = sorted[Math.floor(sorted.length * 0.95)].toFixed(2)
}

export function GalaxyScene({
  items,
  onSelect,
  reduceMotion,
}: {
  items: TechStackItem[]
  onSelect: (id: string) => void
  reduceMotion: boolean
}) {
  const profile = ULTRA_GALAXY_QUALITY
  const galaxyRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const dragIntensityRef = useRef(0)
  const dragDirectionRef = useRef({ x: 1, y: 0 })
  const dragVelocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const activeIdRef = useRef<string | null>(null)
  const focusTargetRef = useRef(new Vector3())
  const diagnosticsSamples = useRef<number[]>([])
  const diagnosticsWarmup = useRef(0)
  const { camera, gl, raycaster, scene, size } = useThree()
  const drag = useMemo(() => ({ direction: dragDirectionRef, intensity: dragIntensityRef }), [])
  const tierGroups = useMemo(() => ({
    primary: items.filter((item) => (item.tier ?? 'supporting') === 'primary'),
    supporting: items.filter((item) => (item.tier ?? 'supporting') === 'supporting'),
    learning: items.filter((item) => (item.tier ?? 'supporting') === 'learning'),
  }), [items])
  useEffect(() => {
    const previousMask = raycaster.layers.mask
    raycaster.layers.enable(TECH_NODE_RENDER_LAYER)
    return () => {
      raycaster.layers.mask = previousMask
    }
  }, [raycaster])

  const pipelineRef = useRef<{
    fbo: WebGLRenderTarget
    blackHoleFbo: WebGLRenderTarget
    composite: { camera: OrthographicCamera; geometry: PlaneGeometry; material: ShaderMaterial; scene: Scene }
    postProcessing: ReturnType<typeof createGalaxyPostProcessing>
  } | null>(null)

  useEffect(() => {
    const targetWidth = Math.max(2, Math.floor(size.width * profile.renderTargetScale))
    const targetHeight = Math.max(2, Math.floor(size.height * profile.renderTargetScale))
    const fbo = new WebGLRenderTarget(targetWidth, targetHeight, {
      depthBuffer: true,
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      stencilBuffer: false,
      type: HalfFloatType,
    })
    fbo.depthTexture = new DepthTexture(targetWidth, targetHeight)
    const blackHoleFbo = new WebGLRenderTarget(targetWidth, targetHeight, {
      depthBuffer: false,
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      stencilBuffer: false,
      type: HalfFloatType,
    })

    const compositeScene = new Scene()
    const compositeCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new PlaneGeometry(2, 2)
    const material = new ShaderMaterial({
      vertexShader: worldSpaceKerrBlackHoleVertexShader,
      fragmentShader: worldSpaceKerrBlackHoleFragmentShader,
      uniforms: createWorldSpaceKerrBlackHoleUniforms(),
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.frustumCulled = false
    compositeScene.add(mesh)
    const composite = { camera: compositeCamera, geometry, material, scene: compositeScene }
    const postProcessing = createGalaxyPostProcessing({
      renderer: gl,
      sourceTexture: blackHoleFbo.texture,
      width: size.width,
      height: size.height,
      profile,
    })
    postProcessing.resize(size.width, size.height)
    pipelineRef.current = { fbo, blackHoleFbo, composite, postProcessing }

    return () => {
      if (pipelineRef.current?.fbo === fbo) pipelineRef.current = null
      postProcessing.dispose()
      geometry.dispose()
      material.dispose()
      blackHoleFbo.dispose()
      fbo.depthTexture?.dispose()
      fbo.dispose()
    }
  }, [gl, profile, size.height, size.width])

  const handleActiveChange = useCallback((id: string, position: Vector3 | null) => {
    if (position) {
      activeIdRef.current = id
      focusTargetRef.current.copy(position).multiplyScalar(0.045)
    } else if (activeIdRef.current === id) {
      activeIdRef.current = null
      focusTargetRef.current.set(0, 0, 0)
    }
  }, [])

  useFrame((_, delta) => {
    reportDiagnostics(delta, diagnosticsSamples, diagnosticsWarmup, gl.domElement)
    if (!galaxyRef.current || reduceMotion) return
    if (!isDraggingRef.current) {
      galaxyRef.current.rotation.y += delta * TECH_GALAXY_SCENE_CONFIG.idleRotationSpeed
      galaxyRef.current.rotation.x = Math.sin(Date.now() * 0.00006) * 0.045
    }
    dragIntensityRef.current += ((isDraggingRef.current ? 1 : 0) - dragIntensityRef.current) * Math.min(1, delta * 3.2)
    const velocity = Math.hypot(dragVelocityRef.current.x, dragVelocityRef.current.y)
    if (velocity > 0.001) {
      dragDirectionRef.current = {
        x: dragVelocityRef.current.x / velocity,
        y: dragVelocityRef.current.y / velocity,
      }
    }
    dragVelocityRef.current.x *= 0.9
    dragVelocityRef.current.y *= 0.9
    if (controlsRef.current) {
      controlsRef.current.target.lerp(focusTargetRef.current, 1 - Math.exp(-delta * 3.4))
    }
  })

  const cameraWorldPosition = useRef(new Vector3())
  const viewProjection = useRef(new Matrix4())

  useFrame((state, delta) => {
    const pipeline = pipelineRef.current
    if (!pipeline) return
    const { blackHoleFbo, composite, fbo, postProcessing } = pipeline
    const material = composite.material
    camera.updateMatrixWorld()
    cameraWorldPosition.current.setFromMatrixPosition(camera.matrixWorld)
    viewProjection.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)

    material.uniforms.uSpaceTexture.value = fbo.texture
    material.uniforms.uSpaceDepth.value = fbo.depthTexture
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse)
    material.uniforms.uCameraWorldMatrix.value.copy(camera.matrixWorld)
    material.uniforms.uViewProjectionMatrix.value.copy(viewProjection.current)
    material.uniforms.uCameraPosition.value.copy(cameraWorldPosition.current)

    gl.setRenderTarget(fbo)
    gl.clear()
    const previousCameraLayerMask = camera.layers.mask
    camera.layers.set(0)
    gl.render(scene, camera)
    gl.setRenderTarget(blackHoleFbo)
    gl.clear()
    gl.render(composite.scene, composite.camera)
    gl.setRenderTarget(null)
    postProcessing.render(delta, state.clock.elapsedTime)
    renderForegroundLayer({
      camera,
      layer: TECH_NODE_RENDER_LAYER,
      renderer: gl,
      scene,
    })
    camera.layers.mask = previousCameraLayerMask
  }, 1)
  const handleStart = () => {
    isDraggingRef.current = true
    lastPosRef.current = { x: camera.position.x, y: camera.position.y }
  }
  const handleEnd = () => { isDraggingRef.current = false }
  const handleChange = () => {
    const dx = camera.position.x - lastPosRef.current.x
    const dy = camera.position.y - lastPosRef.current.y
    dragVelocityRef.current = { x: dx * 8, y: dy * 8 }
    lastPosRef.current = { x: camera.position.x, y: camera.position.y }
  }

  return (
    <>
      <color attach="background" args={[TECH_GALAXY_CANVAS_CONFIG.background]} />
      {profile.nebulaShells.map((config, index) => (
        <NebulaShell key={config.seed} config={config} index={index} reduceMotion={reduceMotion} />
      ))}
      <group ref={galaxyRef} rotation={TECH_GALAXY_SCENE_CONFIG.groupRotation}>
        <OrbitalGuides />
        {profile.starFields.map((config) => (
          <CinematicStarField key={config.seed} config={config} reduceMotion={reduceMotion} drag={drag} />
        ))}
        {items.map((item) => {
          const tier = item.tier ?? 'supporting'
          const tierItems = tierGroups[tier]
          const placement = getTechNodePlacement(item, tierItems.findIndex(({ id }) => id === item.id), tierItems.length)
          return (
            <TechBeacon
              key={item.id}
              item={item}
              index={items.findIndex(({ id }) => id === item.id)}
              position={placement.position}
              size={placement.size}
              reduceMotion={reduceMotion}
              onSelect={onSelect}
              onActiveChange={handleActiveChange}
            />
          )
        })}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        minDistance={TECH_GALAXY_CONTROLS_CONFIG.minDistance}
        maxDistance={TECH_GALAXY_CONTROLS_CONFIG.maxDistance}
        minPolarAngle={TECH_GALAXY_CONTROLS_CONFIG.minPolarAngle}
        maxPolarAngle={TECH_GALAXY_CONTROLS_CONFIG.maxPolarAngle}
        autoRotate={!reduceMotion}
        autoRotateSpeed={TECH_GALAXY_CONTROLS_CONFIG.autoRotateSpeed}
        onStart={handleStart}
        onEnd={handleEnd}
        onChange={handleChange}
        enableDamping
        dampingFactor={TECH_GALAXY_CONTROLS_CONFIG.dampingFactor}
      />
    </>
  )
}
