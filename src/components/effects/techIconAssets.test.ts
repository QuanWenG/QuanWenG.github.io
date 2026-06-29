import { describe, expect, it } from 'vitest'
import { SVGLoader } from 'three-stdlib'
import { inlineSvgPaintReferences, resolveSvgPaint } from './techIconSvg'

const svgModules = import.meta.glob('../../assets/tech-icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

describe('technology SVG assets', () => {
  it('parses every SVG into renderable vector paths', () => {
    expect(Object.keys(svgModules).length).toBeGreaterThan(0)
    Object.entries(svgModules).forEach(([path, source]) => {
      const parsed = new SVGLoader().parse(source)
      expect(parsed.paths.length, path).toBeGreaterThan(0)
    })
  })

  it('resolves AstrBot gradient paint to a visible purple material color', () => {
    const astrBotSource = Object.entries(svgModules).find(([path]) => path.endsWith('/astrbot.svg'))?.[1]
    expect(astrBotSource).toBeTruthy()
    const color = resolveSvgPaint('url(#a)', astrBotSource || '', '#ffffff')
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(color.toLowerCase()).not.toBe('#ffffff')
    expect(inlineSvgPaintReferences(astrBotSource || '')).not.toContain('url(#a)')
  })
})