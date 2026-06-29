import { Billboard, Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
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
import type { Group } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { usePreferences } from '../../app/providers/usePreferences'
import reactIcon from '../../assets/tech-icons/react.png?url'
import typescriptIcon from '../../assets/tech-icons/typescript.png?url'
import javaIcon from '../../assets/tech-icons/java.png?url'
import mysqlIcon from '../../assets/tech-icons/mysql.png?url'
import redisIcon from '../../assets/tech-icons/redis.png?url'
import networkIcon from '../../assets/tech-icons/network.png?url'
import osIcon from '../../assets/tech-icons/os.png?url'
import threeIcon from '../../assets/tech-icons/three.png?url'
import { textByLocale } from '../../services/i18n'
import type { TechStackItem } from '../../types/content'
import { useMediaQuery } from '../common/useMediaQuery'
import { starFragmentShader, starVertexShader } from './galaxyShaders'
import {
  createPhysicalBlackHoleUniforms,
  physicalBlackHoleFragmentShader,
  physicalBlackHoleVertexShader,
} from './schwarzschildBlackHoleShader'


interface TechGalaxyProps {
  items: TechStackItem[]
}

interface TechIconBillboardProps {
  item: TechStackItem
  index: number
  total: number
  reduceMotion: boolean
}

type GalaxyLayer = 'farDistant' | 'galaxyDisk'

interface VolumetricStarFieldProps {
  count: number
  radius: number
  layer: GalaxyLayer
  reduceMotion: boolean
  dragIntensity: number
  dragDirection: { x: number; y: number }
  warpStrength: number
}

const techIconUrls: Record<string, string> = {
  react: reactIcon,
  typescript: typescriptIcon,
  java: javaIcon,
  mysql: mysqlIcon,
  redis: redisIcon,
  network: networkIcon,
  os: osIcon,
  three: threeIcon,
}

const STAR_CENTER_CLEAR_RADIUS: Record<GalaxyLayer, number> = {
  farDistant: 7.2,
  galaxyDisk: 12.4,
}
const TECH_ORBIT_SCALE = 2.35
const TECH_ORBIT_MIN_RADIUS = 6.2
const TECH_OCCLUSION_DEPTH_MARGIN = 0.25
const TECH_OCCLUSION_WORLD_RADIUS = 3.3
const TECH_OCCLUSION_MASK_RADIUS_PX = 150
const TECH_OCCLUSION_MASK_SOFTNESS_PX = 26

function resolveTechIcon(item: TechStackItem) {
  return techIconUrls[item.icon ?? item.id] ?? networkIcon
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

function TechIconBillboard({ item, index, total, reduceMotion }: TechIconBillboardProps) {
  const { locale } = usePreferences()
  const { camera, size: viewportSize } = useThree()
  const groupRef = useRef<Group>(null)
  const visualRef = useRef<Group>(null)
  const iconRef = useRef<HTMLButtonElement>(null)
  const worldPosRef = useRef(new Vector3())
  const iconCameraPosRef = useRef(new Vector3())
  const blackHoleCameraPosRef = useRef(new Vector3())
  const iconNdcRef = useRef(new Vector3())
  const blackHoleNdcRef = useRef(new Vector3())
  const maskRef = useRef({ visible: false, x: -200, y: -200, clipped: false })
  const [hovered, setHovered] = useState(false)
  const active = hovered
  const angle = (index / total) * Math.PI * 2 + index * 0.42
  const baseOrbitRadius = item.orbitRadius ?? 3.2 + (index % 3) * 0.6
  const radius = Math.max(TECH_ORBIT_MIN_RADIUS, baseOrbitRadius * TECH_ORBIT_SCALE)
  const size = (item.size ?? 0.22) * 2.9
  const biasX = item.positionBias?.[0] ?? 0
  const biasY = item.positionBias?.[1] ?? 0
  const biasZ = item.positionBias?.[2] ?? 0
  const position = useMemo<[number, number, number]>(() => {
    return [Math.cos(angle) * radius + biasX, Math.sin(index * 1.37) * 1.1 + biasY, Math.sin(angle) * radius + biasZ]
  }, [angle, biasX, biasY, biasZ, index, radius])
  const iconPixelSize = Math.round(62 + size * 44)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return
    }
    if (!reduceMotion) {
      groupRef.current.rotation.y += delta * (0.12 + index * 0.01)
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.8 + index) * 0.04
    const target = active ? 1.2 : pulse
    groupRef.current.scale.lerp(new Vector3(target, target, target), 0.12)

    // 黑洞遮挡：先用相机空间判断前后，再用屏幕像素圆做局部裁切。
    groupRef.current.getWorldPosition(worldPosRef.current)
    iconCameraPosRef.current.copy(worldPosRef.current).applyMatrix4(camera.matrixWorldInverse)
    blackHoleCameraPosRef.current.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse)

    const behindBlackHole = iconCameraPosRef.current.z < blackHoleCameraPosRef.current.z - TECH_OCCLUSION_DEPTH_MARGIN
    const axisDistance = Math.hypot(iconCameraPosRef.current.x - blackHoleCameraPosRef.current.x, iconCameraPosRef.current.y - blackHoleCameraPosRef.current.y)

    iconNdcRef.current.copy(worldPosRef.current).project(camera)
    blackHoleNdcRef.current.set(0, 0, 0).project(camera)
    const rawMaskX = ((blackHoleNdcRef.current.x - iconNdcRef.current.x) * 0.5 * viewportSize.width) / Math.max(iconPixelSize, 1) * 100 + 50
    const rawMaskY = ((iconNdcRef.current.y - blackHoleNdcRef.current.y) * 0.5 * viewportSize.height) / Math.max(iconPixelSize, 1) * 100 + 50
    const screenDxPx = (blackHoleNdcRef.current.x - iconNdcRef.current.x) * 0.5 * viewportSize.width
    const screenDyPx = (iconNdcRef.current.y - blackHoleNdcRef.current.y) * 0.5 * viewportSize.height
    const overlapsMaskCircle = Math.hypot(screenDxPx, screenDyPx) < TECH_OCCLUSION_MASK_RADIUS_PX + iconPixelSize * 0.62
    const shouldMask = behindBlackHole && (axisDistance < TECH_OCCLUSION_WORLD_RADIUS || overlapsMaskCircle)
    const maskX = shouldMask ? rawMaskX : -200
    const maskY = shouldMask ? rawMaskY : -200
    const maskRadius = shouldMask ? (TECH_OCCLUSION_MASK_RADIUS_PX / Math.max(iconPixelSize, 1)) * 100 : 0
    const maskSoftness = (TECH_OCCLUSION_MASK_SOFTNESS_PX / Math.max(iconPixelSize, 1)) * 100
    const hiddenByMask = shouldMask && Math.hypot(maskX - 50, maskY - 50) < maskRadius - 50
    if (visualRef.current) {
      visualRef.current.visible = !shouldMask
    }

    if (hiddenByMask && hovered) {
      setHovered(false)
    }
    if (iconRef.current) {
      const lastMask = maskRef.current
      if (shouldMask !== lastMask.visible || hiddenByMask !== lastMask.clipped || Math.abs(maskX - lastMask.x) > 0.25 || Math.abs(maskY - lastMask.y) > 0.25) {
        iconRef.current.style.setProperty('--tech-mask-x', `${maskX}%`)
        iconRef.current.style.setProperty('--tech-mask-y', `${maskY}%`)
        iconRef.current.style.setProperty('--tech-mask-radius', `${maskRadius}%`)
        iconRef.current.style.setProperty('--tech-mask-softness', `${maskSoftness}%`)
        iconRef.current.style.pointerEvents = hiddenByMask ? 'none' : 'auto'
        maskRef.current = { visible: shouldMask, x: maskX, y: maskY, clipped: hiddenByMask }
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow>
        <Html center transform distanceFactor={5.1} className="tech-icon-html">
          <button
            ref={iconRef}
            type="button"
            className={`tech-icon-node${active ? ' tech-icon-node--active' : ''}`}
            style={{ '--tech-icon-size': `${iconPixelSize}px`, '--tech-icon-glow': item.color } as CSSProperties}
            aria-label={`${item.name} ${item.group}`}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
          >
            <img src={resolveTechIcon(item)} alt="" aria-hidden="true" draggable={false} />
          </button>
        </Html>
        {active && (
          <Html center position={[0, -size * 1.35, 0]} className="tech-label tech-label--active">
            <span>{item.name}</span>
            <small>{item.group}</small>
            <em>{textByLocale(item.description, locale)}</em>
          </Html>
        )}
      </Billboard>
      <group ref={visualRef}>
        <mesh>
          <sphereGeometry args={[size * 1.45, 32, 32]} />
          <meshBasicMaterial color={item.color} transparent opacity={active ? 0.14 : 0.055} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI * 0.5, 0.2, 0]}>
          <torusGeometry args={[size * 1.25, 0.006, 8, 128]} />
          <meshBasicMaterial color={item.color} transparent opacity={active ? 0.74 : 0.22} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      </group>
    </group>
  )
}

function GalaxyScene({ items, reduceMotion }: TechGalaxyProps & { reduceMotion: boolean }) {
  const galaxyRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [dragIntensity, setDragIntensity] = useState(0)
  const dragIntensityRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragVelocityRef = useRef({ x: 0, y: 0 })
  const lastPosRef = useRef({ x: 0, y: 0 })
  const dragDirectionRef = useRef({ x: 1, y: 0 })
  const { gl, scene, camera, size } = useThree()

  // FBO：空间场景渲染目标
  const fbo = useMemo(() => {
    const w = Math.max(2, Math.floor(size.width * 1.5))
    const h = Math.max(2, Math.floor(size.height * 1.5))
    return new WebGLRenderTarget(w, h, {
      depthBuffer: true,
      stencilBuffer: false,
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    })
  }, [size.width, size.height])

  useEffect(() => () => {
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
      galaxyRef.current.rotation.y += delta * 0.018
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
      <color attach="background" args={['#01040a']} />
      <fog attach="fog" args={['#01040a', 12, 30]} />
      <ambientLight intensity={0.12} />
      <group ref={galaxyRef} rotation={[0.08, 0, -0.16]}>
        <VolumetricStarField count={1050} radius={19} layer="farDistant" reduceMotion={reduceMotion} dragIntensity={dragIntensity} dragDirection={dragDirectionRef.current} warpStrength={0.14} />
        <VolumetricStarField count={560} radius={18} layer="galaxyDisk" reduceMotion={reduceMotion} dragIntensity={dragIntensity} dragDirection={dragDirectionRef.current} warpStrength={0.48} />

        {items.map((item, index) => (
          <TechIconBillboard key={item.id} item={item} index={index} total={items.length} reduceMotion={reduceMotion} />
        ))}
      </group>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={22}
        autoRotate={!reduceMotion && !isDraggingRef.current}
        autoRotateSpeed={0.12}
        onStart={handleStart}
        onEnd={handleEnd}
        onChange={handleChange}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

export function TechGalaxy({ items }: TechGalaxyProps) {
  const { locale } = usePreferences()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const compact = useMediaQuery('(max-width: 760px)')

  if (compact || reduceMotion) {
    return (
      <div className="tech-cosmos-fallback" aria-label="Tech stack list">
        <div className="tech-cosmos-fallback__stars" aria-hidden="true" />
        {items.map((item) => (
          <article key={item.id} className="tech-cosmos-fallback__item">
            <span className="tech-cosmos-fallback__icon" style={{ boxShadow: `0 0 22px ${item.color}` }}>
              <img src={resolveTechIcon(item)} alt="" aria-hidden="true" />
            </span>
            <div>
              <strong>{item.name}</strong>
              <small>{item.group}</small>
              <p>{textByLocale(item.description, locale)}</p>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <div className="tech-galaxy" aria-label="Interactive cosmic tech stack">
      <Canvas
        camera={{ position: [0, 1.4, 10.5], fov: 50 }}
        dpr={[1, 1.35]}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#01040a', 1)
        }}
      >
        <GalaxyScene items={items} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  )
}
