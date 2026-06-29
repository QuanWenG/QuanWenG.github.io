import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProject, isValidSnapshot, shouldWriteSnapshot } from './sync-github.mjs'

const config = {
  id: 'suite', name: 'Manual title', description: 'Manual description', cover: '', category: 'fullstack',
  techIds: ['react', 'kotlin'], techStack: ['React', 'Kotlin'], featured: true, weight: 10,
  repositories: [{ name: 'front', label: 'Frontend' }, { name: 'back', label: 'Backend' }],
}
const repo = (name, overrides = {}) => ({
  name, url: `https://github.com/example/${name}`, stars: 1, updatedAt: '2026-01-01T00:00:00Z',
  primaryLanguage: 'JavaScript', archived: false, languages: { JavaScript: 10 }, ...overrides,
})

test('manual presentation fields win while GitHub metrics aggregate', () => {
  const project = buildProject(config, new Map([
    ['front', repo('front')],
    ['back', repo('back', { stars: 3, updatedAt: '2026-02-01T00:00:00Z', primaryLanguage: 'Kotlin', languages: { Kotlin: 30 } })],
  ]))
  assert.equal(project.name, 'Manual title')
  assert.equal(project.description, 'Manual description')
  assert.equal(project.github.stars, 4)
  assert.equal(project.github.updatedAt, '2026-02-01T00:00:00Z')
  assert.equal(project.github.primaryLanguage, 'Kotlin')
  assert.equal(project.links.length, 2)
})

test('a missing repository reuses its previous per-repository snapshot', () => {
  const previous = buildProject(config, new Map([['front', repo('front')], ['back', repo('back', { stars: 4 })]]))
  const project = buildProject(config, new Map([['front', repo('front', { stars: 2 })]]), previous)
  assert.equal(project.github.stars, 6)
  assert.equal(project.github.repositories.length, 2)
})

test('a suite is archived only when every included repository is archived', () => {
  const active = buildProject(config, new Map([['front', repo('front', { archived: true })], ['back', repo('back')]]))
  const archived = buildProject(config, new Map([['front', repo('front', { archived: true })], ['back', repo('back', { archived: true })]]))
  assert.equal(active.status, 'active')
  assert.equal(archived.status, 'archived')
})

test('repositories can use an organization owner distinct from the default owner', () => {
  const organizationConfig = {
    ...config,
    repositories: [{ owner: 'CyanReef', name: 'Tiffany', label: 'Tiffany' }],
  }
  const project = buildProject(organizationConfig, new Map([
    ['CyanReef/Tiffany', repo('Tiffany', { owner: 'CyanReef', url: 'https://github.com/CyanReef/Tiffany' })],
  ]), null, 'QuanWenG')
  assert.equal(project.url, 'https://github.com/CyanReef/Tiffany')
  assert.equal(project.github.repositories[0].owner, 'CyanReef')
  assert.equal(project.source, 'organization')
  assert.equal(project.featured, true)
})
test('invalid or fully stale first snapshots are not written', () => {
  const project = buildProject(config, new Map([['front', repo('front')], ['back', repo('back')]]))
  const expectedRepositories = { suite: 2 }
  assert.equal(isValidSnapshot([project], 1, expectedRepositories), true)
  assert.equal(isValidSnapshot([{ ...project, links: project.links.slice(0, 1) }], 1, expectedRepositories), false)
  assert.equal(shouldWriteSnapshot(0, [project], 1, true, expectedRepositories), false)
  assert.equal(shouldWriteSnapshot(1, [project], 1, true, expectedRepositories), true)
  assert.equal(shouldWriteSnapshot(1, [], 1, false, expectedRepositories), false)
})