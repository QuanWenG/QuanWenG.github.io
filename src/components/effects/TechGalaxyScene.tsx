import { Billboard, Html, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import type { Group, Mesh as ThreeMesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { TechStackItem } from '../../types/content'
import { starFragmentShader, starVertexShader } from './galaxyShaders'
import {
  BLACK_HOLE_OCCLUDER_RADIUS,
  getTechNodePlacement,
  STAR_CENTER_CLEAR_RADIUS,
  TECH_GALAXY_CANVAS_CONFIG,
  TECH_GALAXY_CONTROLS_CONFIG,
  TECH_GALAXY_SCENE_CONFIG,
  TECH_GALAXY_STAR_FIELDS,
  TECH_TOOLTIP_Z_INDEX_RANGE,
  type GalaxyLayer,
} from './techGalaxyConfig'
import { TechIcon } from './TechIcon'
import {
  createPhysicalBlackHoleUniforms,
  physicalBlackHoleFragmentShader,
  physicalBlackHoleVertexShader,
} from './schwarzschildBlackHoleShader'

interface TechIconBillboardProps {
  item: TechStackItem
  index: number
  total: number
  reduceMotion: boolean
  onSelect: (id: string) => void
  blackHoleOccluder: RefObject<ThreeMesh | null>
}

interface VolumetricStarFieldProps {
  count: number
  radius: number
  layer: GalaxyLayer
  reduceMotion: boolean
  dragIntensity: number
  dragDirection: { x: number; y: number }
  warpStrength: number
}
function createStars(count: number, radius: number, layer: GalaxyLayer) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)
  const layers = new Float32Array(count)
  const white = new Color('#ffffff')
  const warmWhite = new Color('#fff7e8')
  const coolWhite = new Color('#edf4ff')
  const paleBlueWhite = new Color('#dfe9ff')
  const goldWhite = new Color('#fff0d1')

  const layerValue = layer === 'farDistant' ? 0 : 0.5
  const clearRadius = STAR_CENTER_CLEAR_RADIUS[layer]

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3
    let x = 0
    let y = 0
    let z = 0

    if (layer === 'farDistant') {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.75 + Math.random() * 0.5)
      x = Math.sin(phi) * Math.cos(theta) * r
      y = Math.cos(phi) * r * 0.7
      z = Math.sin(phi) * Math.sin(theta) * r
    } else {
      // 远离黑洞的有机随机盘面分布，使用软避让避免形成硬星环边界。
      const theta = Math.random() * Math.PI * 2
      const outerRadius = Math.max(radius, clearRadius + 3.5)
      const edgeBlend = Math.pow(Math.random(), 0.58)
      const r = clearRadius + edgeBlend * (outerRadius - clearRadius)
      const jitter = 2.4 + (1 - edgeBlend) * 2.8
      x = Math.cos(theta) * r + (Math.random() - 0.5) * jitter
      y = (Math.random() - 0.5) * 0.65
      z = Math.sin(theta) * r + (Math.random() - 0.5) * jitter
    }

    if (layer === 'farDistant') {
      const sightlineDistance = Math.hypot(x, y)
      if (sightlineDistance < clearRadius) {
        const theta = sightlineDistance > 0.001 ? Math.atan2(y, x) : Math.random() * Math.PI * 2
        const targetDistance = clearRadius + 2.4 + Math.pow(Math.random(), 0.6) * 7.5
        x = Math.cos(theta) * targetDistance + (Math.random() - 0.5) * 1.2
        y = Math.sin(theta) * targetDistance + (Math.random() - 0.5) * 1.2
      }
    } else {
      const diskDistance = Math.hypot(x, z)
      if (diskDistance < clearRadius) {
        const theta = diskDistance > 0.001 ? Math.atan2(z, x) : Math.random() * Math.PI * 2
        const targetDistance = clearRadius + 2.8 + Math.pow(Math.random(), 0.62) * 5.8
        x = Math.cos(theta) * targetDistance + (Math.random() - 0.5) * 2.6
        z = Math.sin(theta) * targetDistance + (Math.random() - 0.5) * 2.6
      }
    }

    positions[stride] = x
    positions[stride + 1] = y
    positions[stride + 2] = z

    const palette = Math.random()
    let color: Color
    if (layer === 'farDistant') {
      color = palette < 0.9 ? white.clone() : palette < 0.97 ? warmWhite.clone() : palette < 0.995 ? coolWhite.clone() : paleBlueWhite.clone()
    } else {
      color = palette < 0.84 ? white.clone() : palette < 0.94 ? warmWhite.clone() : palette < 0.99 ? coolWhite.clone() : goldWhite.clone()
    }

    const intensity = layer === 'farDistant' ? 0.42 + Math.random() * 0.32 : 0.5 + Math.random() * 0.28
    colors[stride] = color.r * intensity
    colors[stride + 1] = color.g * intensity
    colors[stride + 2] = color.b * intensity
    sizes[index] = layer === 'farDistant' ? 1.35 + Math.random() * 2.6 : 1.8 + Math.random() * 3.4
    phases[index] = Math.random() * Math.PI * 2
    speeds[index] = layer === 'farDistant' ? 0.015 + Math.random() * 0.035 : layer === 'galaxyDisk' ? 0.08 + Math.random() * 0.18 : 0.3 + Math.random() * 0.5
    layers[index] = layerValue + (Math.random() - 0.5) * 0.1
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aOrbitSpeed', new BufferAttribute(speeds, 1))
  geometry.setAttribute('aLayer', new BufferAttribute(layers, 1))
  return geometry
}

function VolumetricStarField({ count, radius, layer, reduceMotion, dragIntensity, dragDirection, warpStrength }: VolumetricStarFieldProps) {
  const materialRef = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => createStars(count, radius, layer), [count, layer, radius])

  useFrame(({ clock }) => {
    if (!materialRef.current) {
      return
    }
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
    materialRef.current.uniforms.uDragIntensity.value = dragIntensity
    materialRef.current.uniforms.uDragDirection.value.set(dragDirection.x, dragDirection.y)
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
          uMotion: { value: reduceMotion ? 0 : 1 },
          uDragIntensity: { value: 0 },
          uDragDirection: { value: new Vector2(1, 0) },
          uWarpStrength: { value: warpStrength },
        }}
      />
    </points>
  )
}

function TechIconBillboard({ item, index, total, reduceMotion, onSelect, blackHoleOccluder }: TechIconBillboardProps) {
  const { locale } = usePreferences()
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const active = hovered
  const { position, size } = useMemo(() => getTechNodePlacement(item, index, total), [index, item, total])
  const iconWorldSize = size * 1.58


  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    if (!reduceMotion) groupRef.current.rotation.y += delta * (0.12 + index * 0.01)
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.8 + index) * 0.04
    const target = active ? 1.2 : pulse
    groupRef.current.scale.lerp(new Vector3(target, target, target), 0.12)
  })

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow>
        <group
          renderOrder={6}
          onClick={(event) => { event.stopPropagation(); onSelect(item.id) }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
        >
          <TechIcon item={item} size={iconWorldSize} />
        </group>
        <Html center zIndexRange={[1, 0]} className="tech-icon-a11y">
          <button
            type="button"
            aria-label={`${item.name} ${item.group}`}
            onClick={() => onSelect(item.id)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
          >
            {item.name}
          </button>
        </Html>
        {active && (
          <Html
            center
            position={[0, -size * 1.35, 0]}
            zIndexRange={TECH_TOOLTIP_Z_INDEX_RANGE}
            occlude={[blackHoleOccluder as RefObject<ThreeMesh>]}
            onOcclude={(occluded) => { if (occluded) setHovered(false) }}
            className="tech-label tech-label--active"
          >
            <span>{item.name}</span>
            <small>{item.group}</small>
            <em>{textByLocale(item.description, locale)}</em>
          </Html>
        )}
      </Billboard>

    </group>
  )
}

export function GalaxyScene({ items, reduceMotion, onSelect }: { items: TechStackItem[]; reduceMotion: boolean; onSelect: (id: string) => void }) {
  const galaxyRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const blackHoleOccluderRef = useRef<ThreeMesh>(null)
  const [dragIntensity, setDragIntensity] = useState(0)
  const dragIntensityRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragVelocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const dragDirectionRef = useRef({ x: 1, y: 0 })
  const { gl, scene, camera, size } = useThree()
  const tierGroups = useMemo(() => ({
    primary: items.filter((item) => (item.tier ?? 'supporting') === 'primary'),
    supporting: items.filter((item) => (item.tier ?? 'supporting') === 'supporting'),
    learning: items.filter((item) => (item.tier ?? 'supporting') === 'learning'),
  }), [items])

  // FBO：空间场景渲染目标
  const fbo = useMemo(() => {
    const w = Math.max(2, Math.floor(size.width * TECH_GALAXY_SCENE_CONFIG.renderTargetScale))
    const h = Math.max(2, Math.floor(size.height * TECH_GALAXY_SCENE_CONFIG.renderTargetScale))
    const target = new WebGLRenderTarget(w, h, {
      depthBuffer: true,
      stencilBuffer: false,
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    })
    target.depthTexture = new DepthTexture(w, h)
    return target
  }, [size.width, size.height])

  useEffect(() => () => {
    fbo.depthTexture?.dispose()
    fbo.dispose()
  }, [fbo])

  // 合成场景：全屏正交平面 + 透镜着色器
  const composite = useMemo(() => {
    const compScene = new Scene()
    const compCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new PlaneGeometry(2, 2)
    const material = new ShaderMaterial({
      vertexShader: physicalBlackHoleVertexShader,
      fragmentShader: physicalBlackHoleFragmentShader,
      uniforms: createPhysicalBlackHoleUniforms(),
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.frustumCulled = false
    compScene.add(mesh)
    return { scene: compScene, camera: compCam, geometry, material }
  }, [])

  useEffect(() => () => {
    composite.geometry.dispose()
    composite.material.dispose()
  }, [composite])

  const bhScreen = useRef(new Vector3())
  const bhWorld = useRef(new Vector3())
  const blackHoleView = useRef(new Vector3())
  const diskMajorWorld = useRef(new Vector3())
  const diskMajorPoint = useRef(new Vector3())
  const diskMajorScreen = useRef(new Vector3())

  // 拖拽与缓慢自转逻辑
  useFrame((_, delta) => {
    if (!galaxyRef.current || reduceMotion) {
      return
    }

    if (!isDraggingRef.current) {
      galaxyRef.current.rotation.y += delta * TECH_GALAXY_SCENE_CONFIG.idleRotationSpeed
      galaxyRef.current.rotation.x = Math.sin(performance.now() * 0.00006) * 0.05
    }

    if (isDraggingRef.current) {
      const target = Math.min(1, dragIntensityRef.current + delta * 4)
      dragIntensityRef.current = target
    } else {
      const target = Math.max(0, dragIntensityRef.current - delta * 1.8)
      dragIntensityRef.current = target
    }
    setDragIntensity(dragIntensityRef.current)

    const vel = Math.sqrt(dragVelocityRef.current.x ** 2 + dragVelocityRef.current.y ** 2)
    if (vel > 0.001) {
      dragDirectionRef.current = {
        x: dragVelocityRef.current.x / vel,
        y: dragVelocityRef.current.y / vel,
      }
    }
    dragVelocityRef.current.x *= 0.92
    dragVelocityRef.current.y *= 0.92
  })

  // 双通道渲染：空间场景 → FBO → 透镜合成 → 屏幕
  useFrame((state) => {
    const mat = composite.material
    // 黑洞盘面固定在世界 XZ 平面；用观察方向求屏幕长轴，避免水平绕行时发生滚转。
    bhWorld.current.set(0, 0, 0)
    bhScreen.current.copy(bhWorld.current).project(camera)
    blackHoleView.current.copy(camera.position).sub(bhWorld.current)
    diskMajorWorld.current.set(blackHoleView.current.z, 0, -blackHoleView.current.x)
    if (diskMajorWorld.current.lengthSq() > 1e-6) {
      diskMajorWorld.current.normalize()
      diskMajorPoint.current.copy(bhWorld.current).add(diskMajorWorld.current)
      diskMajorScreen.current.copy(diskMajorPoint.current).project(camera)
      const axisX = (diskMajorScreen.current.x - bhScreen.current.x) * size.width
      const axisY = (diskMajorScreen.current.y - bhScreen.current.y) * size.height
      if (Math.hypot(axisX, axisY) > 0.001) {
        mat.uniforms.uDiskDirection.value.set(axisX, axisY).normalize()
      }
    }

    mat.uniforms.uBlackHolePosition.value.set(bhScreen.current.x * 0.5 + 0.5, bhScreen.current.y * 0.5 + 0.5)
    mat.uniforms.uSpaceTexture.value = fbo.texture
    mat.uniforms.uSpaceDepth.value = fbo.depthTexture
    mat.uniforms.uBlackHoleDepth.value = bhScreen.current.z * 0.5 + 0.5
    mat.uniforms.uAspect.value = size.width / Math.max(size.height, 1)
    mat.uniforms.uTime.value = state.clock.elapsedTime

    // 屏幕阴影半径对应 Schwarzschild 临界曲线，而非事件视界球体大小。
    const dist = camera.position.distanceTo(bhWorld.current)
    const radialDistance = Math.hypot(blackHoleView.current.x, blackHoleView.current.z)
    mat.uniforms.uObserverElevation.value = Math.min(1.52, Math.max(-1.52, Math.atan2(blackHoleView.current.y, radialDistance)))
    mat.uniforms.uObserverAzimuth.value = Math.atan2(blackHoleView.current.x, blackHoleView.current.z)
    const scale = Math.min(2.35, Math.max(0.48, 10.5 / Math.max(dist, 0.001)))
    mat.uniforms.uShadowRadius.value = 0.066 * scale

    gl.setRenderTarget(fbo)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.render(composite.scene, composite.camera)
  }, 1)

  const handleStart = () => {
    isDraggingRef.current = true
    lastPosRef.current = { x: camera.position.x, y: camera.position.y }
  }

  const handleEnd = () => {
    isDraggingRef.current = false
  }

  const handleChange = () => {
    if (!controlsRef.current) return
    const dx = camera.position.x - lastPosRef.current.x
    const dy = camera.position.y - lastPosRef.current.y
    dragVelocityRef.current = { x: dx * 8, y: dy * 8 }
    lastPosRef.current = { x: camera.position.x, y: camera.position.y }
  }

  return (
    <>
      <color attach="background" args={[TECH_GALAXY_CANVAS_CONFIG.background]} />
      <fog attach="fog" args={[TECH_GALAXY_CANVAS_CONFIG.background, TECH_GALAXY_SCENE_CONFIG.fogNear, TECH_GALAXY_SCENE_CONFIG.fogFar]} />
      <ambientLight intensity={TECH_GALAXY_SCENE_CONFIG.ambientLightIntensity} />
      <mesh
        ref={blackHoleOccluderRef}
        onPointerOver={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <sphereGeometry args={[BLACK_HOLE_OCCLUDER_RADIUS, TECH_GALAXY_SCENE_CONFIG.blackHoleOccluderSegments, TECH_GALAXY_SCENE_CONFIG.blackHoleOccluderSegments]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} depthTest={false} />
      </mesh>
      <group ref={galaxyRef} rotation={TECH_GALAXY_SCENE_CONFIG.groupRotation}>
        {TECH_GALAXY_STAR_FIELDS.map((field) => <VolumetricStarField key={field.layer} {...field} reduceMotion={reduceMotion} dragIntensity={dragIntensity} dragDirection={dragDirectionRef.current} />)}

        {items.map((item) => {
          const tier = item.tier ?? 'supporting'
          const tierItems = tierGroups[tier]
          return <TechIconBillboard key={item.id} item={item} index={tierItems.findIndex(({ id }) => id === item.id)} total={tierItems.length} reduceMotion={reduceMotion} onSelect={onSelect} blackHoleOccluder={blackHoleOccluderRef} />
        })}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={TECH_GALAXY_CONTROLS_CONFIG.minDistance}
        maxDistance={TECH_GALAXY_CONTROLS_CONFIG.maxDistance}
        autoRotate={!reduceMotion && !isDraggingRef.current}
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
