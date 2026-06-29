import { describe, expect, it } from 'vitest'
import site from './site.json'
import ui from './ui.json'

describe('published interface copy', () => {
  it('describes current features without roadmap language', () => {
    const publishedCopy = JSON.stringify({ ui, placeholders: site.placeholders })
    expect(publishedCopy).not.toMatch(/后续会|下一阶段|coming soon|will connect|\bnext\b/i)
  })
})