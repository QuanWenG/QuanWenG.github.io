import { Billboard, Html, OrbitControls, useTexture } from '@react-three/drei'
import { ArrowRight, BookOpen, FolderGit2, X } from 'lucide-react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DepthTexture,
  DoubleSide,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import type { Group, Mesh as ThreeMesh, ShapePath } from 'three'
import { SVGLoader, type OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { usePreferences } from '../../app/providers/usePreferences'

import { textByLocale } from '../../services/i18n'
import type { TechStackItem, TechTier, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { useMediaQuery } from '../common/useMediaQuery'
import { starFragmentShader, starVertexShader } from './galaxyShaders'
import { resolveSvgPaint } from './techIconSvg'
import {
  createPhysicalBlackHoleUniforms,
  physicalBlackHoleFragmentShader,
  physicalBlackHoleVertexShader,
} from './schwarzschildBlackHoleShader'


interface TechGalaxyProps {
  items: TechStackItem[]
  projects: ProjectItem[]
  ui: UiCopy
}

interface TechIconBillboardProps {
  item: TechStackItem
  index: number
  total: number
  reduceMotion: boolean
  onSelect: (id: string) => void
  blackHoleOccluder: RefObject<ThreeMesh | null>
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

interface TechIconAsset {
  url: string
  svg?: string
}

interface SvgIconPart {
  geometry: BufferGeometry
  color: string
  opacity: number
}

interface SvgPathStyle {
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeOpacity?: number
  strokeWidth?: number
  strokeLineJoin?: string
  strokeLineCap?: string
  strokeMiterLimit?: number
}

const techIconModules = import.meta.glob('../../assets/tech-icons/*.{png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const techIconSvgModules = import.meta.glob('../../assets/tech-icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const techIconSvgSources = Object.fromEntries(Object.entries(techIconSvgModules).map(([path, source]) => {
  const filename = path.split('/').pop() || ''
  return [filename.replace(/\.svg$/i, ''), source]
})) as Record<string, string>

const techIconAssets = Object.fromEntries(Object.entries(techIconModules).map(([path, url]) => {
  const filename = path.split('/').pop() || ''
  const id = filename.replace(/\.(png|svg)$/i, '')
  return [id, { url, svg: techIconSvgSources[id] }]
})) as Record<string, TechIconAsset>

const STAR_CENTER_CLEAR_RADIUS: Record<GalaxyLayer, number> = {
  farDistant: 7.2,
  galaxyDisk: 12.4,
}
const TIER_ORBIT_RADIUS: Record<TechTier, number> = { primary: 6.35, supporting: 7.85, learning: 9.25 }
const TIER_VERTICAL_SPREAD: Record<TechTier, number> = { primary: 1.35, supporting: 2.15, learning: 2.85 }
const TIER_SIZE_SCALE: Record<TechTier, number> = { primary: 3, supporting: 2.65, learning: 2.25 }
const TECH_TOOLTIP_Z_INDEX_RANGE: [number, number] = [80, 60]
const BLACK_HOLE_OCCLUDER_RADIUS = 0.68

function resolveTechIconAsset(item: TechStackItem) {
  return techIconAssets[item.icon ?? item.id] ?? techIconAssets.network
}

function resolveTechIcon(item: TechStackItem) {
  return resolveTechIconAsset(item).url
}

function RasterTechIcon({ url, size }: { url: string; size: number }) {
  const texture = useTexture(url)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  return (
    <mesh>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.04} depthTest depthWrite toneMapped={false} fog={false} />
    </mesh>
  )
}

function SvgTechIcon({ source, size }: { source: string; size: number }) {
  const parsed = useMemo(() => new SVGLoader().parse(source), [source])
  const { parts, scale, offsetX, offsetY } = useMemo(() => {
    const viewBox = source.match(/viewBox=["']([^"']+)["']/i)?.[1]?.trim().split(/[\s,]+/).map(Number) ?? [0, 0, 24, 24]
    const [minX = 0, minY = 0, width = 24, height = 24] = viewBox
    const iconScale = size / Math.max(width, height, 1)
    const iconParts: SvgIconPart[] = []

    parsed.paths.forEach((path) => {
      const style = (path.userData?.style || {}) as SvgPathStyle
      const fallbackFill = `#${path.color.getHexString()}`
      const fill = resolveSvgPaint(style.fill || fallbackFill, source, fallbackFill)
      if (fill !== 'none' && fill !== 'transparent') {
        SVGLoader.createShapes(path as ShapePath).forEach((shape) => {
          const geometry = new ShapeGeometry(shape)
          iconParts.push({ geometry, color: fill, opacity: style.fillOpacity ?? 1 })
        })
      }

      if (style.stroke && style.stroke !== 'none' && (style.strokeWidth ?? 1) > 0) {
        const strokeStyle = SVGLoader.getStrokeStyle(
          style.strokeWidth ?? 1,
          style.stroke,
          style.strokeLineJoin,
          style.strokeLineCap,
          style.strokeMiterLimit,
        )
        path.subPaths.forEach((subPath) => {
          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), strokeStyle)
          if (geometry.getAttribute('position')?.count) {
            iconParts.push({ geometry, color: style.stroke || '#ffffff', opacity: style.strokeOpacity ?? 1 })
          } else {
            geometry.dispose()
          }
        })
      }
    })

    return {
      parts: iconParts,
      scale: iconScale,
      offsetX: -(minX + width * 0.5) * iconScale,
      offsetY: (minY + height * 0.5) * iconScale,
    }
  }, [parsed, size, source])

  useEffect(() => () => parts.forEach(({ geometry }) => geometry.dispose()), [parts])

  return (
    <group position={[offsetX, offsetY, 0]} scale={[scale, -scale, 1]}>
      {parts.map((part, partIndex) => (
        <mesh key={part.geometry.uuid} geometry={part.geometry} position={[0, 0, partIndex * 0.0002]}>
          <meshBasicMaterial color={part.color} opacity={part.opacity} transparent={part.opacity < 1} side={DoubleSide} depthTest depthWrite toneMapped={false} fog={false} />
        </mesh>
      ))}
    </group>
  )
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
  const iconAsset = resolveTechIconAsset(item)
  const [hovered, setHovered] = useState(false)
  const active = hovered
  const tier = item.tier ?? 'supporting'
  const tierOffset = tier === 'primary' ? 0.2 : tier === 'supporting' ? 0.88 : 1.46
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + tierOffset
  const radius = item.orbitRadius ?? TIER_ORBIT_RADIUS[tier]
  const size = (item.size ?? 0.22) * TIER_SIZE_SCALE[tier]
  const biasX = item.positionBias?.[0] ?? 0
  const biasY = item.positionBias?.[1] ?? 0
  const biasZ = item.positionBias?.[2] ?? 0
  const position = useMemo<[number, number, number]>(() => {
    return [Math.cos(angle) * radius + biasX, Math.sin(index * 1.618 + tierOffset) * TIER_VERTICAL_SPREAD[tier] + biasY, Math.sin(angle) * radius + biasZ]
  }, [angle, biasX, biasY, biasZ, index, radius, tier, tierOffset])
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
          {iconAsset.svg
            ? <SvgTechIcon source={iconAsset.svg} size={iconWorldSize} />
            : <RasterTechIcon url={iconAsset.url} size={iconWorldSize} />}
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

function GalaxyScene({ items, reduceMotion, onSelect }: { items: TechStackItem[]; reduceMotion: boolean; onSelect: (id: string) => void }) {
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
    const w = Math.max(2, Math.floor(size.width * 1.5))
    const h = Math.max(2, Math.floor(size.height * 1.5))
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
      <color attach="background" args={['#01040a']} />
      <fog attach="fog" args={['#01040a', 12, 30]} />
      <ambientLight intensity={0.12} />
      <mesh
        ref={blackHoleOccluderRef}
        onPointerOver={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <sphereGeometry args={[BLACK_HOLE_OCCLUDER_RADIUS, 32, 32]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} depthTest={false} />
      </mesh>
      <group ref={galaxyRef} rotation={[0.08, 0, -0.16]}>
        <VolumetricStarField count={1050} radius={19} layer="farDistant" reduceMotion={reduceMotion} dragIntensity={dragIntensity} dragDirection={dragDirectionRef.current} warpStrength={0.14} />
        <VolumetricStarField count={560} radius={18} layer="galaxyDisk" reduceMotion={reduceMotion} dragIntensity={dragIntensity} dragDirection={dragDirectionRef.current} warpStrength={0.48} />

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

function TechDetailPanel({ item, projects, ui, locale, onClose }: { item: TechStackItem; projects: ProjectItem[]; ui: UiCopy; locale: 'zh' | 'en'; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null)
  const relatedProjects = projects.filter((project) => (item.projectIds || []).includes(project.id))
  const tier = item.tier ?? 'supporting'
  useEffect(() => { panelRef.current?.focus() }, [item.id])

  return (
    <aside ref={panelRef} className="tech-detail-panel" tabIndex={-1} aria-labelledby="tech-detail-title">
      <button className="tech-detail-panel__close" type="button" onClick={onClose} aria-label={textByLocale(ui['tech.closeDetails'], locale)}><X aria-hidden="true" /></button>
      <span className={`tech-detail-panel__tier is-${tier}`}>{textByLocale(ui[`tech.tier.${tier}`], locale)}</span>
      <div className="tech-detail-panel__title">
        <img src={resolveTechIcon(item)} alt="" aria-hidden="true" />
        <div><h3 id="tech-detail-title">{item.name}</h3><small>{item.group}</small></div>
      </div>
      <p>{textByLocale(item.description, locale)}</p>
      {relatedProjects.length > 0 && <section><h4><FolderGit2 aria-hidden="true" />{textByLocale(ui['tech.relatedProjects'], locale)}</h4><div className="tech-detail-panel__links">{relatedProjects.map((project) => <a key={project.id} href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a>)}</div></section>}
      {(item.articles || []).length > 0 && <section><h4><BookOpen aria-hidden="true" />{textByLocale(ui['tech.relatedArticles'], locale)}</h4><div className="tech-detail-panel__links">{item.articles?.map((article) => <Link key={article.slug} to={`/blog/${article.slug}`}>{textByLocale(article.title, locale)}</Link>)}</div></section>}
      {relatedProjects.length > 0 && <Link className="tech-detail-panel__cta" to="/projects">{textByLocale(ui['tech.viewProjects'], locale)}<ArrowRight aria-hidden="true" /></Link>}
    </aside>
  )
}

function TechTierLegend({ ui, locale }: { ui: UiCopy; locale: 'zh' | 'en' }) {
  return <div className="tech-tier-legend" aria-label="Technology orbit legend">{(['primary', 'supporting', 'learning'] as TechTier[]).map((tier) => <span key={tier} className={`is-${tier}`}>{textByLocale(ui[`tech.tier.${tier}`], locale)}</span>)}</div>
}

export function TechGalaxy({ items, projects, ui }: TechGalaxyProps) {
  const { locale } = usePreferences()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const compact = useMediaQuery('(max-width: 760px)')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedItem = items.find((item) => item.id === selectedId) || null

  useEffect(() => {
    if (!selectedItem) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedItem])

  if (compact || reduceMotion) {
    return (
      <div className="tech-cosmos-fallback" aria-label="Tech stack list">
        <div className="tech-cosmos-fallback__stars" aria-hidden="true" />
        <TechTierLegend ui={ui} locale={locale} />
        {items.map((item) => (
          <button key={item.id} type="button" className={`tech-cosmos-fallback__item is-${item.tier || 'supporting'}`} aria-label={item.name} onClick={() => setSelectedId(item.id)}>
            <span className="tech-cosmos-fallback__icon" style={{ boxShadow: `0 0 22px ${item.color}` }}>
              <img src={resolveTechIcon(item)} alt="" aria-hidden="true" />
            </span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.group}</small>
              <p>{textByLocale(item.description, locale)}</p>
            </span>
          </button>
        ))}
        {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
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
        <GalaxyScene items={items} reduceMotion={reduceMotion} onSelect={setSelectedId} />
      </Canvas>
      <TechTierLegend ui={ui} locale={locale} />
      {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
    </div>
  )
}