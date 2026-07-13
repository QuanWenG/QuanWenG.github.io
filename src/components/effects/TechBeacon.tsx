import { Billboard, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  Color,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { Group } from 'three'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { TechStackItem } from '../../types/content'
import { beaconFragmentShader, beaconVertexShader } from './beaconShaders'
import {
  getTechNodeRenderLayer,
  TECH_TOOLTIP_Z_INDEX_RANGE,
} from './techGalaxyConfig'
import { TechIcon } from './TechIcon'

interface TechBeaconProps {
  index: number
  item: TechStackItem
  onActiveChange: (id: string, position: Vector3 | null) => void
  onSelect: (id: string) => void
  position: [number, number, number]
  reduceMotion: boolean
  selected: boolean
  size: number
}

export function TechBeacon({
  index,
  item,
  onActiveChange,
  onSelect,
  position,
  reduceMotion,
  selected,
  size,
}: TechBeaconProps) {
  const { locale } = usePreferences()
  const groupRef = useRef<Group>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const activeValue = useRef(0)
  const renderLayerRef = useRef(-1)
  const cameraPositionRef = useRef(new Vector3())
  const renderPositionRef = useRef(new Vector3())
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const active = hovered || focused || selected
  const worldPosition = useMemo(() => new Vector3(...position), [position])
  const color = useMemo(() => new Color(item.color), [item.color])
  const beaconSize = size * 1.9
  const iconSize = size * 0.92


  useEffect(() => {
    onActiveChange(item.id, active ? worldPosition : null)
    return () => onActiveChange(item.id, null)
  }, [active, item.id, onActiveChange, worldPosition])

  useFrame(({ camera, clock }, delta) => {
    const group = groupRef.current
    if (!group || !materialRef.current) return
    const cameraPosition = camera.getWorldPosition(cameraPositionRef.current)
    const renderPosition = group.getWorldPosition(renderPositionRef.current)
    const renderLayer = getTechNodeRenderLayer(cameraPosition, renderPosition)
    if (renderLayerRef.current !== renderLayer) {
      group.traverse((object) => object.layers.set(renderLayer))
      renderLayerRef.current = renderLayer
    }
    activeValue.current += ((active ? 1 : 0) - activeValue.current) * Math.min(1, delta * 8)
    materialRef.current.uniforms.uActive.value = activeValue.current
    materialRef.current.uniforms.uTime.value = reduceMotion ? 0 : clock.elapsedTime + index * 0.31
    const pulse = reduceMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 1.15 + index) * 0.018
    const distance = cameraPosition.distanceTo(renderPosition)
    const distanceScale = Math.min(1.2, Math.max(0.38, distance / 10.5))
    const scale = (1 + activeValue.current * 0.1) * pulse * distanceScale
    group.scale.lerp(new Vector3(scale, scale, scale), Math.min(1, delta * 10))
  })

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow>
        <group
          renderOrder={7}
          onClick={(event) => { event.stopPropagation(); onSelect(item.id) }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
        >

          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[beaconSize, beaconSize]} />
            <shaderMaterial
              ref={materialRef}
              vertexShader={beaconVertexShader}
              fragmentShader={beaconFragmentShader}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              uniforms={{
                uTime: { value: 0 },
                uActive: { value: 0 },
                uColor: { value: color },
              }}
            />
          </mesh>
          <group position={[0, 0, 0.012]}>
            <TechIcon item={item} size={iconSize} />
          </group>
        </group>
        <Html center zIndexRange={[1, 0]} className="tech-icon-a11y">
          <button
            type="button"
            aria-label={`${item.name} ${item.group}`}
            onClick={() => onSelect(item.id)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          >
            {item.name}
          </button>
        </Html>
        {active && (
          <Html
            center
            position={[0, -size * 1.46, 0]}
            zIndexRange={TECH_TOOLTIP_Z_INDEX_RANGE}
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
