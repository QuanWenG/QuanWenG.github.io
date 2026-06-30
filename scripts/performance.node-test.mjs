import assert from 'node:assert/strict'
import test from 'node:test'
import { createBundleReport } from './check-bundle.mjs'
import { collectCharacters, collectManifestFiles } from './performance-utils.mjs'

test('font character collection normalizes, deduplicates, and retains Unicode code points', () => {
  const characters = collectCharacters(['\u9f9fA\u00e9', 'A', 'e\u0301', '\u{20000}'])
  assert.equal([...characters].filter((character) => character === 'A').length, 1)
  assert.ok(characters.includes('\u00e9'))
  assert.ok(characters.includes('\u9f9f'))
  assert.ok(characters.includes('\u{20000}'))
  assert.ok(characters.includes(' '))
})

test('manifest traversal includes static imports without loading dynamic imports', () => {
  const manifest = {
    'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_shared.js'], dynamicImports: ['src/Lazy.tsx'] },
    '_shared.js': { file: 'assets/shared.js' },
    'src/Lazy.tsx': { file: 'assets/lazy.js' },
  }
  assert.deepEqual(
    [...collectManifestFiles(manifest, 'index.html')].sort(),
    ['assets/index.js', 'assets/shared.js'],
  )
})

test('bundle report excludes initial shared code from the lazy TechGalaxy budget', () => {
  const manifest = {
    'index.html': { file: 'assets/index.js', isEntry: true, imports: ['_shared.js'] },
    '_shared.js': { file: 'assets/shared.js' },
    'src/components/effects/TechGalaxy.tsx': {
      file: 'assets/TechGalaxy.js',
      name: 'TechGalaxy',
      imports: ['_shared.js', '_three.js'],
    },
    '_three.js': { file: 'assets/three.js' },
  }
  const report = createBundleReport({
    manifest,
    gzipSizes: new Map([
      ['assets/index.js', 80_000],
      ['assets/shared.js', 20_000],
      ['assets/TechGalaxy.js', 40_000],
      ['assets/three.js', 200_000],
    ]),
    fontSizes: new Map([['assets/font.woff2', 100_000]]),
  })

  assert.equal(report.initialJavaScriptGzip, 100_000)
  assert.equal(report.techGalaxyJavaScriptGzip, 240_000)
  assert.equal(report.largestFontFile, 100_000)
})
