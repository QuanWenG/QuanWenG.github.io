import { stat, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { collectCharactersFromDirectory, formatKilobytes } from './performance-utils.mjs'

const scriptPath = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptPath), '..')
const sourceRoot = resolve(root, 'src')
const fontRoot = resolve(sourceRoot, 'assets/font')
const fontWeights = ['Light', 'Medium', 'Bold']

export async function generateFontSubsets({
  command = process.env.PYFTSUBSET || 'pyftsubset',
} = {}) {
  const { characters, files } = await collectCharactersFromDirectory(sourceRoot)
  const charactersPath = resolve(tmpdir(), `quanweng-font-characters-${process.pid}.txt`)
  await writeFile(charactersPath, characters, 'utf8')

  try {
    for (const weight of fontWeights) {
      const input = resolve(fontRoot, `HarmonyOS_Sans_SC_${weight}.woff2`)
      const output = resolve(fontRoot, `HarmonyOS_Sans_SC_${weight}.subset.woff2`)
      const result = spawnSync(command, [
        input,
        `--output-file=${output}`,
        `--text-file=${charactersPath}`,
        '--flavor=woff2',
        '--layout-features=*',
        '--no-hinting',
        '--no-recalc-timestamp',
        '--drop-tables+=DSIG',
      ], { stdio: 'inherit' })

      if (result.error) {
        throw new Error(`Unable to run ${command}. Install fonttools and brotli, or set PYFTSUBSET to the executable path.`, { cause: result.error })
      }
      if (result.status !== 0) throw new Error(`${command} failed while subsetting ${weight}.`)

      const { size } = await stat(output)
      console.log(`[font-subset] ${weight}: ${formatKilobytes(size)}`)
    }
  } finally {
    await unlink(charactersPath).catch(() => {})
  }

  console.log(`[font-subset] Collected ${characters.length} characters from ${files.length} TSX, JSON, and Markdown files.`)
}

if (resolve(process.argv[1] || '') === scriptPath) {
  await generateFontSubsets()
}
