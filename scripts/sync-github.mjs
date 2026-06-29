import { existsSync } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptPath), '..')
const configPath = resolve(root, 'src/data/projects.config.json')
const outputPath = resolve(root, 'src/data/projects.json')

async function readJson(path) {
  return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
}

function repositoryOwner(repository, defaultOwner = '') {
  return repository.owner || defaultOwner
}

function repositoryKey(owner, name) {
  return `${owner}/${name}`
}

function previousRepository(previousProject, owner, name) {
  return previousProject?.github?.repositories?.find((repository) => repository.name === name && (!repository.owner || repository.owner === owner)) || null
}

export function buildProject(config, repositoryResults, previousProject = null, defaultOwner = '') {
  const repositoryConfigs = config.repositories.map((repository) => ({ ...repository, owner: repositoryOwner(repository, defaultOwner) }))
  const repositories = repositoryConfigs.map(({ owner, name }) => repositoryResults.get(repositoryKey(owner, name)) || repositoryResults.get(name) || previousRepository(previousProject, owner, name)).filter(Boolean)
  if (!repositories.length) return previousProject

  const languageTotals = new Map()
  for (const repository of repositories) {
    const entries = Object.entries(repository.languages || {})
    if (entries.length) {
      for (const [language, bytes] of entries) languageTotals.set(language, (languageTotals.get(language) || 0) + bytes)
    } else if (repository.primaryLanguage) {
      languageTotals.set(repository.primaryLanguage, (languageTotals.get(repository.primaryLanguage) || 0) + 1)
    }
  }
  const primaryLanguage = [...languageTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  const links = repositoryConfigs.map(({ owner, name, label }) => {
    const repository = repositories.find((item) => item.name === name && (!item.owner || item.owner === owner))
    return repository ? { label, url: repository.url, repository: name } : null
  }).filter(Boolean)
  const primaryConfig = repositoryConfigs[0]
  const primary = repositories.find((repository) => repository.name === primaryConfig.name && (!repository.owner || repository.owner === primaryConfig.owner)) || repositories[0]
  const updatedAt = repositories.map((repository) => repository.updatedAt).filter(Boolean).sort().at(-1) || ''
  const status = config.status === 'draft' ? 'draft' : repositories.every((repository) => repository.archived) ? 'archived' : 'active'
  const source = repositoryConfigs.some(({ owner }) => owner && owner !== defaultOwner) ? 'organization' : 'personal'

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    url: primary.url,
    cover: config.cover,
    techStack: config.techStack,
    techIds: config.techIds,
    category: config.category,
    links,
    github: {
      stars: repositories.reduce((total, repository) => total + repository.stars, 0),
      updatedAt,
      primaryLanguage,
      repositories: repositories.map(({ languages: _languages, ...repository }) => repository),
    },
    featured: config.featured || source === 'organization',
    weight: config.weight,
    status,
    source,
  }
}

export function isValidSnapshot(projects, expectedCount, expectedRepositoryCounts = {}) {
  return Array.isArray(projects)
    && projects.length === expectedCount
    && projects.every((project) => {
      const repositoryCount = project?.github?.repositories?.length || 0
      const expectedRepositories = expectedRepositoryCounts[project?.id] || repositoryCount
      return project?.id && project?.url && project?.links?.length === expectedRepositories && repositoryCount === expectedRepositories
    })
}

export function shouldWriteSnapshot(freshCount, projects, expectedCount, previousExists, expectedRepositoryCounts = {}) {
  if (!isValidSnapshot(projects, expectedCount, expectedRepositoryCounts)) return false
  return freshCount > 0 || !previousExists
}

async function fetchRepository(owner, name, headers) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers })
  if (!response.ok) throw new Error(`${owner}/${name}: ${response.status}`)
  const repository = await response.json()
  const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { headers })
  const languages = languagesResponse.ok ? await languagesResponse.json() : {}
  return {
    owner,
    name,
    url: repository.html_url,
    stars: repository.stargazers_count || 0,
    updatedAt: repository.pushed_at || repository.updated_at || '',
    primaryLanguage: repository.language || '',
    archived: Boolean(repository.archived),
    languages,
  }
}

export async function syncGitHubProjects({ configFile = configPath, outputFile = outputPath } = {}) {
  const config = await readJson(configFile)
  const previous = existsSync(outputFile) ? await readJson(outputFile) : []
  const previousById = new Map(previous.map((project) => [project.id, project]))
  const repositories = [...new Map(config.projects.flatMap((project) => project.repositories.map((repository) => {
    const owner = repositoryOwner(repository, config.owner)
    return [repositoryKey(owner, repository.name), { owner, name: repository.name }]
  }))).values()]
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'QuanWenG-project-sync',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  }
  const results = new Map()
  let freshCount = 0
  await Promise.all(repositories.map(async ({ owner, name }) => {
    try {
      results.set(repositoryKey(owner, name), await fetchRepository(owner, name, headers))
      freshCount += 1
    } catch (error) {
      console.warn(`[github-sync] ${error instanceof Error ? error.message : String(error)}; keeping the previous repository snapshot.`)
    }
  }))

  const projects = config.projects.map((project) => buildProject(project, results, previousById.get(project.id), config.owner)).filter(Boolean)
  const expectedRepositoryCounts = Object.fromEntries(config.projects.map((project) => [project.id, project.repositories.length]))
  if (!shouldWriteSnapshot(freshCount, projects, config.projects.length, previous.length > 0, expectedRepositoryCounts)) {
    if (freshCount === 0 && isValidSnapshot(previous, config.projects.length, expectedRepositoryCounts)) {
      console.warn('[github-sync] GitHub was unavailable; the checked-in snapshot remains unchanged.')
      return previous
    }
    throw new Error('GitHub project sync did not produce a complete valid snapshot.')
  }

  const temporaryPath = `${outputFile}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(projects, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, outputFile)
  console.log(`[github-sync] Updated ${projects.length} projects from ${freshCount}/${repositories.length} repositories.`)
  return projects
}

if (resolve(process.argv[1] || '') === scriptPath) {
  await syncGitHubProjects()
}