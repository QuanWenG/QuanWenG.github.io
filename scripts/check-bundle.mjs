import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  collectManifestFiles,
  findManifestKey,
  formatKilobytes,
  sumSizes,
} from './performance-utils.mjs'

const scriptPath = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptPath), '..')

export const BUNDLE_BUDGETS = {
  initialJavaScriptGzip: 130_000,
  fontFile: 600_000,
}

export function createBundleReport({ manifest, gzipSizes, fontSizes }) {
  const entryKey = findManifestKey(manifest, (entry) => entry.isEntry, 'application entry')
  const techGalaxyKey = findManifestKey(
    manifest,
    (entry, key) => key.replaceAll('\\', '/').endsWith('/components/effects/TechGalaxy.tsx') || entry.name === 'TechGalaxy',
    'TechGalaxy chunk',
  )
  const initialFiles = collectManifestFiles(manifest, entryKey)
  const techGalaxyFiles = collectManifestFiles(manifest, techGalaxyKey)
  for (const file of initialFiles) techGalaxyFiles.delete(file)

  return {
    initialJavaScriptGzip: sumSizes(initialFiles, gzipSizes),
    techGalaxyJavaScriptGzip: sumSizes(techGalaxyFiles, gzipSizes),
    largestFontFile: Math.max(...fontSizes.values()),
    initialFiles,
    techGalaxyFiles,
  }
}

async function readBuildSizes(distRoot, manifest) {
  const javascriptFiles = new Set(
    Object.values(manifest)
      .map((entry) => entry.file)
      .filter((file) => file?.endsWith('.js')),
  )
  const gzipSizes = new Map()

  await Promise.all([...javascriptFiles].map(async (file) => {
    const contents = await readFile(resolve(distRoot, file))
    gzipSizes.set(file, gzipSync(contents, { level: 9 }).byteLength)
  }))

  const assetsRoot = resolve(distRoot, 'assets')
  const fontSizes = new Map()
  for (const name of await readdir(assetsRoot)) {
    if (!name.endsWith('.woff2')) continue
    fontSizes.set(`assets/${name}`, (await stat(resolve(assetsRoot, name))).size)
  }
  if (!fontSizes.size) throw new Error('No WOFF2 fonts were emitted by the production build.')

  return { gzipSizes, fontSizes }
}

export async function checkBundle({ distRoot = resolve(root, 'dist') } = {}) {
  const manifest = JSON.parse(await readFile(resolve(distRoot, '.vite/manifest.json'), 'utf8'))
  const { gzipSizes, fontSizes } = await readBuildSizes(distRoot, manifest)
  const report = createBundleReport({ manifest, gzipSizes, fontSizes })
  const checks = [
    ['Initial JavaScript gzip', report.initialJavaScriptGzip, BUNDLE_BUDGETS.initialJavaScriptGzip],
    ['Largest subset font', report.largestFontFile, BUNDLE_BUDGETS.fontFile],
  ]

  console.log(`[bundle-budget] REPORT TechGalaxy JavaScript gzip: ${formatKilobytes(report.techGalaxyJavaScriptGzip)}`)

  let failed = false
  for (const [label, actual, budget] of checks) {
    const passed = actual <= budget
    failed ||= !passed
    console.log(`[bundle-budget] ${passed ? 'PASS' : 'FAIL'} ${label}: ${formatKilobytes(actual)} / ${formatKilobytes(budget)}`)
  }

  if (failed) throw new Error('Production assets exceed the configured performance budget.')
  return report
}

if (resolve(process.argv[1] || '') === scriptPath) {
  await checkBundle()
}
