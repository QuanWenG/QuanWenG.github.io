import { describe, expect, it } from 'vitest'
import { resolvePublicAssetPath } from './publicAssetPath'

describe('resolvePublicAssetPath', () => {
  it('resolves relative and root-like paths against BASE_URL', () => {
    expect(resolvePublicAssetPath('media/cover.jpg')).toBe(`${import.meta.env.BASE_URL}media/cover.jpg`)
    expect(resolvePublicAssetPath('/media/cover.jpg')).toBe(`${import.meta.env.BASE_URL}media/cover.jpg`)
  })

  it('preserves empty and externally resolved sources', () => {
    expect(resolvePublicAssetPath('')).toBe('')
    expect(resolvePublicAssetPath('https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(resolvePublicAssetPath('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(resolvePublicAssetPath('blob:https://example.com/id')).toBe('blob:https://example.com/id')
  })
})
