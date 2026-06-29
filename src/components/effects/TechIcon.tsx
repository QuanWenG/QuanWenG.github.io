import { useTexture } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { BufferGeometry, DoubleSide, ShapeGeometry, SRGBColorSpace } from 'three'
import type { ShapePath } from 'three'
import { SVGLoader } from 'three-stdlib'
import type { TechStackItem } from '../../types/content'
import { resolveTechIconAsset } from './techIconAssets'
import { inlineSvgPaintReferences, resolveSvgPaint } from './techIconSvg'

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

function RasterTechIcon({ url, size }: { url: string; size: number }) {
  const texture = useTexture(url)
  useEffect(() => {
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  return <mesh><planeGeometry args={[size, size]} /><meshBasicMaterial map={texture} transparent alphaTest={0.04} depthTest depthWrite toneMapped={false} fog={false} /></mesh>
}

function SvgTechIcon({ source, size }: { source: string; size: number }) {
  const renderSource = useMemo(() => inlineSvgPaintReferences(source), [source])
  const parsed = useMemo(() => new SVGLoader().parse(renderSource), [renderSource])
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
          iconParts.push({ geometry: new ShapeGeometry(shape), color: fill, opacity: style.fillOpacity ?? 1 })
        })
      }
      if (style.stroke && style.stroke !== 'none' && (style.strokeWidth ?? 1) > 0) {
        const strokeStyle = SVGLoader.getStrokeStyle(style.strokeWidth ?? 1, style.stroke, style.strokeLineJoin, style.strokeLineCap, style.strokeMiterLimit)
        path.subPaths.forEach((subPath) => {
          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), strokeStyle)
          if (geometry.getAttribute('position')?.count) iconParts.push({ geometry, color: style.stroke || '#ffffff', opacity: style.strokeOpacity ?? 1 })
          else geometry.dispose()
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
  return <group position={[offsetX, offsetY, 0]} scale={[scale, -scale, 1]}>{parts.map((part, index) => (
    <mesh key={part.geometry.uuid} geometry={part.geometry} position={[0, 0, index * 0.0002]}>
      <meshBasicMaterial color={part.color} opacity={part.opacity} transparent={part.opacity < 1} side={DoubleSide} depthTest depthWrite toneMapped={false} fog={false} />
    </mesh>
  ))}</group>
}

export function TechIcon({ item, size }: { item: TechStackItem; size: number }) {
  const asset = resolveTechIconAsset(item)
  return asset.svg ? <SvgTechIcon source={asset.svg} size={size} /> : <RasterTechIcon url={asset.url} size={size} />
}
