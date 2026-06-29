import type { TechStackItem } from '../../types/content'

export interface TechIconAsset {
  url: string
  svg?: string
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

export function resolveTechIconAsset(item: TechStackItem) {
  return techIconAssets[item.icon ?? item.id] ?? techIconAssets.network
}

export function resolveTechIcon(item: TechStackItem) {
  return resolveTechIconAsset(item).url
}