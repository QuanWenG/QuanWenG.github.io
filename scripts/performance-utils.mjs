import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

export const CONTENT_EXTENSIONS = new Set(['.json', '.md', '.tsx'])

export async function findContentFiles(directory, extensions = CONTENT_EXTENSIONS) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await findContentFiles(path, extensions))
    } else if (entry.isFile() && extensions.has(extname(entry.name))) {
      files.push(path)
    }
  }

  return files
}

export function collectCharacters(texts) {
  const characters = new Set([' ', '\u00a0'])

  for (const text of texts) {
    for (const character of text.normalize('NFC')) {
      const codePoint = character.codePointAt(0)
      if (codePoint >= 0x20 && codePoint !== 0x7f) characters.add(character)
    }
  }

  return [...characters]
    .sort((left, right) => left.codePointAt(0) - right.codePointAt(0))
    .join('')
}

export async function collectCharactersFromDirectory(directory) {
  const files = await findContentFiles(directory)
  const texts = await Promise.all(files.map((file) => readFile(file, 'utf8')))
  return {
    characters: collectCharacters(texts),
    files,
  }
}

export function collectManifestFiles(manifest, entryKey) {
  const files = new Set()
  const visited = new Set()

  function visit(key) {
    if (!key || visited.has(key)) return
    visited.add(key)

    const entry = manifest[key]
    if (!entry) throw new Error(`Manifest entry not found: ${key}`)
    if (entry.file?.endsWith('.js')) files.add(entry.file)
    for (const importedKey of entry.imports || []) visit(importedKey)
  }

  visit(entryKey)
  return files
}

export function findManifestKey(manifest, predicate, label) {
  const match = Object.entries(manifest).find(([key, entry]) => predicate(entry, key))
  if (!match) throw new Error(`Unable to find ${label} in the Vite manifest.`)
  return match[0]
}

export function sumSizes(files, sizes) {
  return [...files].reduce((total, file) => {
    const size = sizes.get(file)
    if (size === undefined) throw new Error(`Missing size for ${file}`)
    return total + size
  }, 0)
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} KB`
}
