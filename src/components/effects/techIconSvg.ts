import { Color } from 'three'

export function resolveSvgPaint(paint: string, source: string, fallback: string) {
  const gradientId = paint.match(/^url\(#([^)]+)\)$/)?.[1]
  if (!gradientId) return paint

  const gradientPattern = new RegExp(`<(?:linearGradient|radialGradient)[^>]*id=["']${gradientId}["'][^>]*>([\\s\\S]*?)<\\/(?:linearGradient|radialGradient)>`, 'i')
  const gradientBody = source.match(gradientPattern)?.[1] || ''
  const stopColors = [...gradientBody.matchAll(/stop-color=["']([^"']+)["']/gi)].map((match) => match[1])
  if (!stopColors.length) return fallback
  if (stopColors.length === 1) return stopColors[0]

  const mixed = new Color(stopColors[0])
  mixed.lerp(new Color(stopColors.at(-1)), 0.5)
  return `#${mixed.getHexString()}`
}