import { APP_ROUTES, TECH_STACK_ROUTE } from '../../config/routes'
import { textByLocale } from '../../services/i18n'
import type { ContentIndexEntry, Locale, LocalizedText, NavigationItem, SiteConfig } from '../../types/content'
import type { MusicTrack } from '../../types/music'

type TerminalCategory = 'navigation' | 'explore' | 'control' | 'system'
type ExecutionStatus = 'noop' | 'clear' | 'output'
type OutputKind = 'info' | 'success' | 'error' | 'result'

interface CommandInfo {
  name: string
  aliases: string[]
  category: TerminalCategory
  summary: LocalizedText
  usage: string
  examples: string[]
}

interface NavigationTarget {
  id: 'home' | 'tech' | 'blog' | 'projects' | 'music'
  label: LocalizedText
  href: string
  aliases: string[]
}

export interface QuanWenGTerminalMusicActions {
  tracks: MusicTrack[]
  currentTrack: MusicTrack | null
  isPlaying: boolean
  volume: number
  repeatMode: 'all' | 'one'
  togglePlay: () => void
  previous: () => void
  next: () => void
  setVolume: (volume: number) => void
  toggleRepeat: () => void
}

export interface QuanWenGTerminalPreferencesActions {
  theme: 'light' | 'dark'
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  toggleTheme: () => void
}

export interface QuanWenGTerminalCommandContext {
  locale: Locale
  site: SiteConfig
  navigation: NavigationItem[]
  contentIndex: ContentIndexEntry[]
  lastSearchResults: ContentIndexEntry[]
  locationPathname: string
  navigate: (href: string) => void
  scrollToTechStack: () => void
  openExternal: (href: string) => void
  preferences: QuanWenGTerminalPreferencesActions
  music: QuanWenGTerminalMusicActions
}

export interface QuanWenGTerminalOutputLine {
  kind: OutputKind
  text: string
  command?: string
  href?: string
}

export interface QuanWenGTerminalExecutionResult {
  status: ExecutionStatus
  lines?: QuanWenGTerminalOutputLine[]
  searchResults?: ContentIndexEntry[]
}

export interface QuanWenGTerminalSuggestion {
  id: string
  input: string
  title: string
  detail: string
  category: string
}

export interface ParsedTerminalCommand {
  tokens: string[]
  normalizedCommand: string
  args: string[]
}

const COMMANDS: CommandInfo[] = [
  {
    name: 'help',
    aliases: ['?'],
    category: 'system',
    summary: { zh: '查看命令列表或单条命令帮助。', en: 'Show all commands or focused command help.' },
    usage: 'help [command]',
    examples: ['help cd', 'help music'],
  },
  {
    name: 'cd',
    aliases: ['goto', 'open-page'],
    category: 'navigation',
    summary: { zh: '跳转到站内页面或知识星图锚点。', en: 'Navigate to a site page or the tech galaxy anchor.' },
    usage: 'cd <home|tech|blog|projects|music>',
    examples: ['cd tech', 'cd projects', 'cd 博客'],
  },
  {
    name: 'search',
    aliases: ['find', 's'],
    category: 'explore',
    summary: { zh: '搜索博客、项目、音乐和技术栈内容。', en: 'Search blog, projects, music, and tech stack content.' },
    usage: 'search <query>',
    examples: ['search react', 'search "computer networks"'],
  },
  {
    name: 'open',
    aliases: ['o'],
    category: 'explore',
    summary: { zh: '打开上一次搜索结果编号或内容 id。', en: 'Open a previous search result number or content id.' },
    usage: 'open <number|content-id>',
    examples: ['open 1', 'open project:site'],
  },
  {
    name: 'theme',
    aliases: ['mode'],
    category: 'control',
    summary: { zh: '切换或指定明暗主题。', en: 'Toggle or choose the light/dark theme.' },
    usage: 'theme <toggle|light|dark>',
    examples: ['theme toggle', 'theme dark'],
  },
  {
    name: 'lang',
    aliases: ['language', 'locale'],
    category: 'control',
    summary: { zh: '切换或指定界面语言。', en: 'Toggle or choose the interface language.' },
    usage: 'lang <zh|en|toggle>',
    examples: ['lang en', 'lang toggle'],
  },
  {
    name: 'music',
    aliases: ['player'],
    category: 'control',
    summary: { zh: '打开音乐页或控制全局播放器。', en: 'Open music or control the global player.' },
    usage: 'music <open|play|pause|toggle|next|prev|repeat|volume 0-100>',
    examples: ['music', 'music next', 'music volume 65'],
  },
  {
    name: 'about',
    aliases: ['whoami'],
    category: 'system',
    summary: { zh: '查看这个站点的简短说明。', en: 'Show a short note about this site.' },
    usage: 'about',
    examples: ['about'],
  },
  {
    name: 'clear',
    aliases: ['cls'],
    category: 'system',
    summary: { zh: '清空终端输出。', en: 'Clear terminal output.' },
    usage: 'clear',
    examples: ['clear'],
  },
]

const CATEGORY_LABELS: Record<TerminalCategory, LocalizedText> = {
  navigation: { zh: '导航', en: 'Navigation' },
  explore: { zh: '检索', en: 'Explore' },
  control: { zh: '控制', en: 'Control' },
  system: { zh: '系统', en: 'System' },
}

const KIND_LABELS: Record<ContentIndexEntry['kind'], LocalizedText> = {
  blog: { zh: '博客', en: 'Blog' },
  project: { zh: '项目', en: 'Project' },
  music: { zh: '音乐', en: 'Music' },
  technology: { zh: '技术栈', en: 'Technology' },
}

const NAVIGATION_TARGETS: NavigationTarget[] = [
  {
    id: 'home',
    label: { zh: '首页', en: 'Home' },
    href: APP_ROUTES.home,
    aliases: ['home', 'root', '/', '~', 'index', '首页', '主页'],
  },
  {
    id: 'tech',
    label: { zh: '知识星图', en: 'Tech Galaxy' },
    href: TECH_STACK_ROUTE,
    aliases: ['tech', 'stack', 'galaxy', 'knowledge', '技术栈', '星图', '知识星图'],
  },
  {
    id: 'blog',
    label: { zh: '博客', en: 'Blog' },
    href: APP_ROUTES.blog,
    aliases: ['blog', 'posts', 'notes', '博客', '文章', '笔记'],
  },
  {
    id: 'projects',
    label: { zh: '项目', en: 'Projects' },
    href: APP_ROUTES.projects,
    aliases: ['projects', 'project', 'works', 'repos', '项目', '作品', '仓库'],
  },
  {
    id: 'music',
    label: { zh: '音乐', en: 'Music' },
    href: APP_ROUTES.music,
    aliases: ['music', 'audio', 'player', 'playlist', '音乐', '播放器', '歌单'],
  },
]

const TOP_SUGGESTIONS = ['help', 'cd tech', 'search react', 'music toggle', 'theme toggle', 'lang toggle']

function normalize(value: string) {
  return value.trim().toLocaleLowerCase()
}

function localized(copy: LocalizedText, locale: Locale) {
  return textByLocale(copy, locale)
}

function line(kind: OutputKind, text: string, extra: Pick<QuanWenGTerminalOutputLine, 'command' | 'href'> = {}): QuanWenGTerminalOutputLine {
  return { kind, text, ...extra }
}

function stripCommandPrefix(value: string) {
  return value.trim().replace(/^\/+/, '')
}

function commandByName(name: string) {
  const normalizedName = normalize(name)
  return COMMANDS.find((command) => command.name === normalizedName || command.aliases.includes(normalizedName))
}

function parseQuotedTokens(value: string) {
  const tokens: string[] = []
  const pattern = /"([^"]*)"|'([^']*)'|[^\s]+/g
  for (const match of value.matchAll(pattern)) {
    tokens.push(match[1] ?? match[2] ?? match[0])
  }
  return tokens
}

export function parseQuanWenGTerminalCommand(value: string): ParsedTerminalCommand {
  const tokens = parseQuotedTokens(stripCommandPrefix(value))
  const normalizedCommand = normalize(tokens[0] || '')
  return {
    tokens,
    normalizedCommand,
    args: tokens.slice(1),
  }
}

function resolveNavigationTarget(value: string) {
  const normalizedValue = normalize(value)
  return NAVIGATION_TARGETS.find((target) => (
    target.id === normalizedValue
    || target.aliases.some((alias) => normalize(alias) === normalizedValue)
    || normalize(target.label.zh) === normalizedValue
    || normalize(target.label.en) === normalizedValue
  ))
}

function matchesPrefix(value: string, prefix: string) {
  return normalize(value).startsWith(normalize(prefix))
}

function targetMatches(target: NavigationTarget, prefix: string) {
  if (!prefix) return true
  return [target.id, target.label.zh, target.label.en, ...target.aliases].some((value) => matchesPrefix(value, prefix))
}

function commandMatches(command: CommandInfo, prefix: string) {
  if (!prefix) return true
  return [command.name, ...command.aliases].some((value) => matchesPrefix(value, prefix))
}

function commandLabel(input: string, locale: Locale) {
  const command = commandByName(parseQuanWenGTerminalCommand(input).normalizedCommand)
  return command ? localized(command.summary, locale) : input
}

function formatHelp(command: CommandInfo, locale: Locale) {
  return [
    line('info', `${command.usage} - ${localized(command.summary, locale)}`),
    line('info', `${locale === 'zh' ? '示例' : 'Examples'}: ${command.examples.join(' | ')}`),
  ]
}

function runHelp(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  if (!args.length) {
    const lines = [
      line('info', context.locale === 'zh' ? '可用命令（help <命令> 查看细节）：' : 'Available commands (use help <command> for details):'),
      ...(['navigation', 'explore', 'control', 'system'] as TerminalCategory[]).map((category) => {
        const names = COMMANDS.filter((command) => command.category === category).map((command) => command.usage).join('  ')
        return line('info', `${localized(CATEGORY_LABELS[category], context.locale)}: ${names}`)
      }),
    ]
    return { status: 'output', lines }
  }

  const command = commandByName(args[0])
  if (command?.name === 'help') {
    return {
      status: 'output',
      lines: [line('info', context.locale === 'zh' ? 'help 不需要二级帮助，直接输入 help 查看总览。' : 'help has no nested help. Use help for the overview.')],
    }
  }
  if (!command) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? `没有找到 ${args[0]} 的帮助。` : `No help found for ${args[0]}.`)],
    }
  }
  return { status: 'output', lines: formatHelp(command, context.locale) }
}

function runCd(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const target = resolveNavigationTarget(args[0] || '')
  if (!target) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '用法：cd <home|tech|blog|projects|music>' : 'Usage: cd <home|tech|blog|projects|music>')],
    }
  }

  if (target.id === 'tech' && context.locationPathname === APP_ROUTES.home) context.scrollToTechStack()
  else context.navigate(target.href)

  return {
    status: 'output',
    lines: [line('success', context.locale === 'zh'
      ? `正在前往${localized(target.label, context.locale)}...`
      : `Opening ${localized(target.label, context.locale)}...`)],
  }
}

function scoreContentEntry(entry: ContentIndexEntry, normalizedQuery: string) {
  if (!normalizedQuery) return 0
  const title = normalize(entry.title)
  const id = normalize(entry.id)
  const tags = entry.tags.map(normalize)
  const searchableText = normalize(`${entry.title} ${entry.description} ${entry.searchableText} ${entry.tags.join(' ')}`)
  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  if (!terms.every((term) => searchableText.includes(term))) return 0
  if (title === normalizedQuery || id === normalizedQuery) return 120
  if (title.startsWith(normalizedQuery) || id.startsWith(normalizedQuery)) return 90
  if (title.includes(normalizedQuery)) return 70
  if (tags.some((tag) => tag.includes(normalizedQuery))) return 50
  if (entry.description && normalize(entry.description).includes(normalizedQuery)) return 36
  return 20
}

export function searchContentIndex(entries: ContentIndexEntry[], query: string, limit = 5) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []
  return entries
    .map((entry) => ({ entry, score: scoreContentEntry(entry, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
    .slice(0, limit)
    .map(({ entry }) => entry)
}

function runSearch(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const query = args.join(' ').trim()
  if (!query) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '用法：search <关键词>' : 'Usage: search <query>')],
      searchResults: [],
    }
  }

  const results = searchContentIndex(context.contentIndex, query, 5)
  if (!results.length) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? `没有找到与「${query}」相关的内容。` : `No content found for "${query}".`)],
      searchResults: [],
    }
  }

  const lines = [
    line('info', context.locale === 'zh' ? `找到 ${results.length} 个结果：` : `Found ${results.length} result${results.length > 1 ? 's' : ''}:`),
    ...results.map((entry, index) => {
      const kind = localized(KIND_LABELS[entry.kind], context.locale)
      return line('result', `${index + 1}. ${entry.title} · ${kind} - ${entry.description}`, {
        command: `open ${index + 1}`,
        href: entry.href,
      })
    }),
  ]
  return { status: 'output', lines, searchResults: results }
}

function resolveOpenTarget(args: string[], context: QuanWenGTerminalCommandContext) {
  const target = args.join(' ').trim()
  if (!target) return null
  if (/^\d+$/.test(target)) return context.lastSearchResults[Number(target) - 1] || null
  const normalizedTarget = normalize(target)
  return context.contentIndex.find((entry) => (
    normalize(entry.id) === normalizedTarget
    || normalize(entry.title) === normalizedTarget
    || normalize(entry.href) === normalizedTarget
  )) || null
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

function runOpen(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const target = resolveOpenTarget(args, context)
  if (!target) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '用法：open <搜索结果编号|内容 id>' : 'Usage: open <result number|content id>')],
    }
  }

  if (isExternalHref(target.href)) context.openExternal(target.href)
  else context.navigate(target.href)

  return {
    status: 'output',
    lines: [line('success', context.locale === 'zh' ? `正在打开 ${target.title}...` : `Opening ${target.title}...`)],
  }
}

function runTheme(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const action = normalize(args[0] || 'toggle')
  if (!['toggle', 'light', 'dark'].includes(action)) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '用法：theme <toggle|light|dark>' : 'Usage: theme <toggle|light|dark>')],
    }
  }

  if (action === 'toggle' || action !== context.preferences.theme) context.preferences.toggleTheme()
  const nextTheme = action === 'toggle' ? (context.preferences.theme === 'dark' ? 'light' : 'dark') : action
  return {
    status: 'output',
    lines: [line('success', context.locale === 'zh' ? `主题已切换为 ${nextTheme}。` : `Theme set to ${nextTheme}.`)],
  }
}

function runLang(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const action = normalize(args[0] || 'toggle')
  if (!['toggle', 'zh', 'en'].includes(action)) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '用法：lang <zh|en|toggle>' : 'Usage: lang <zh|en|toggle>')],
    }
  }

  if (action === 'toggle') context.preferences.toggleLocale()
  else if (action !== context.preferences.locale) context.preferences.setLocale(action as Locale)
  const nextLocale = action === 'toggle' ? (context.preferences.locale === 'zh' ? 'en' : 'zh') : action
  return {
    status: 'output',
    lines: [line('success', context.locale === 'zh' ? `语言已切换为 ${nextLocale}。` : `Language set to ${nextLocale}.`)],
  }
}

function runMusic(args: string[], context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const action = normalize(args[0] || 'open')
  if (action === 'open') return runCd(['music'], context)
  if (!context.music.tracks.length) {
    return {
      status: 'output',
      lines: [line('error', context.locale === 'zh' ? '当前没有可播放的音乐。' : 'No tracks are available.')],
    }
  }

  if (action === 'play') {
    if (!context.music.isPlaying) context.music.togglePlay()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '音乐已开始播放。' : 'Music is playing.')] }
  }
  if (action === 'pause') {
    if (context.music.isPlaying) context.music.togglePlay()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '音乐已暂停。' : 'Music paused.')] }
  }
  if (action === 'toggle') {
    context.music.togglePlay()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '已切换播放状态。' : 'Playback toggled.')] }
  }
  if (action === 'next') {
    context.music.next()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '已切到下一首。' : 'Skipped to next track.')] }
  }
  if (action === 'prev' || action === 'previous') {
    context.music.previous()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '已返回上一首。' : 'Returned to previous track.')] }
  }
  if (action === 'repeat') {
    context.music.toggleRepeat()
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? '已切换循环模式。' : 'Repeat mode toggled.')] }
  }
  if (action === 'volume') {
    const value = Number(args[1])
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return {
        status: 'output',
        lines: [line('error', context.locale === 'zh' ? '音量范围是 0-100。' : 'Volume must be between 0 and 100.')],
      }
    }
    context.music.setVolume(value / 100)
    return { status: 'output', lines: [line('success', context.locale === 'zh' ? `音量已设为 ${value}%。` : `Volume set to ${value}%.`)] }
  }

  return {
    status: 'output',
    lines: [line('error', context.locale === 'zh' ? '用法：music <open|play|pause|toggle|next|prev|repeat|volume 0-100>' : 'Usage: music <open|play|pause|toggle|next|prev|repeat|volume 0-100>')],
  }
}

export function runQuanWenGTerminalCommand(rawCommand: string, context: QuanWenGTerminalCommandContext): QuanWenGTerminalExecutionResult {
  const parsed = parseQuanWenGTerminalCommand(rawCommand)
  if (!parsed.tokens.length) return { status: 'noop' }
  const command = commandByName(parsed.normalizedCommand)
  const commandName = command?.name || parsed.normalizedCommand

  if (parsed.normalizedCommand === 'projects') return runCd(['projects'], context)
  if (parsed.normalizedCommand === 'blog') return runCd(['blog'], context)
  if (commandName === 'help') return runHelp(parsed.args, context)
  if (commandName === 'cd') return runCd(parsed.args, context)
  if (commandName === 'search') return runSearch(parsed.args, context)
  if (commandName === 'open') return runOpen(parsed.args, context)
  if (commandName === 'theme') return runTheme(parsed.args, context)
  if (commandName === 'lang') return runLang(parsed.args, context)
  if (commandName === 'music') return runMusic(parsed.args, context)
  if (commandName === 'about') {
    const about = context.site.terminal.commands.about
    return { status: 'output', lines: [line('info', about ? localized(about, context.locale) : commandLabel('about', context.locale))] }
  }
  if (commandName === 'clear') return { status: 'clear' }

  const unknown = context.site.terminal.commands.unknown
  return {
    status: 'output',
    lines: [line('error', unknown ? localized(unknown, context.locale) : (context.locale === 'zh' ? '没有找到这个命令，试试 help。' : 'Command not found. Try help.'))],
  }
}

function suggestion(id: string, input: string, title: string, detail: string, category: string): QuanWenGTerminalSuggestion {
  return { id, input, title, detail, category }
}

function prefixedInput(_rawInput: string, value: string) {
  return value.replace(/^\/+/, '')
}

function topSuggestions(context: QuanWenGTerminalCommandContext, rawInput: string) {
  return TOP_SUGGESTIONS.map((input) => {
    const command = commandByName(parseQuanWenGTerminalCommand(input).normalizedCommand)
    const title = input
    const detail = command ? localized(command.summary, context.locale) : input
    const category = command ? localized(CATEGORY_LABELS[command.category], context.locale) : localized(CATEGORY_LABELS.system, context.locale)
    return suggestion(`top:${input}`, prefixedInput(rawInput, input), title, detail, category)
  })
}

function commandSuggestions(prefix: string, context: QuanWenGTerminalCommandContext, rawInput: string) {
  const extras = [
    suggestion('alias:projects', prefixedInput(rawInput, 'projects'), 'projects', localized(COMMANDS.find(({ name }) => name === 'cd')?.summary || CATEGORY_LABELS.navigation, context.locale), localized(CATEGORY_LABELS.navigation, context.locale)),
    suggestion('alias:blog', prefixedInput(rawInput, 'blog'), 'blog', localized(CATEGORY_LABELS.navigation, context.locale), localized(CATEGORY_LABELS.navigation, context.locale)),
  ]
  return [
    ...COMMANDS
      .filter((command) => commandMatches(command, prefix))
      .map((command) => suggestion(
        `command:${command.name}`,
        prefixedInput(rawInput, command.name),
        command.usage,
        localized(command.summary, context.locale),
        localized(CATEGORY_LABELS[command.category], context.locale),
      )),
    ...extras.filter((item) => matchesPrefix(item.input.replace(/^\//, ''), prefix)),
  ].slice(0, 6)
}

function helpSuggestions(prefix: string, context: QuanWenGTerminalCommandContext, rawInput: string) {
  return COMMANDS
    .filter((command) => command.name !== 'help' && commandMatches(command, prefix))
    .map((command) => suggestion(
      `help:${command.name}`,
      prefixedInput(rawInput, `help ${command.name}`),
      `help ${command.name}`,
      localized(command.summary, context.locale),
      localized(CATEGORY_LABELS.system, context.locale),
    ))
    .slice(0, 6)
}

function cdSuggestions(prefix: string, context: QuanWenGTerminalCommandContext, rawInput: string) {
  return NAVIGATION_TARGETS
    .filter((target) => targetMatches(target, prefix))
    .map((target) => suggestion(
      `cd:${target.id}`,
      prefixedInput(rawInput, `cd ${target.id}`),
      `cd ${target.id}`,
      `${localized(target.label, context.locale)} · ${target.href}`,
      localized(CATEGORY_LABELS.navigation, context.locale),
    ))
    .slice(0, 6)
}

function fixedArgSuggestions(command: string, values: string[], context: QuanWenGTerminalCommandContext, rawInput: string, prefix = '') {
  const info = commandByName(command)
  return values
    .filter((value) => matchesPrefix(value, prefix))
    .map((value) => suggestion(
      `${command}:${value}`,
      prefixedInput(rawInput, `${command} ${value}`),
      `${command} ${value}`,
      info ? localized(info.summary, context.locale) : value,
      info ? localized(CATEGORY_LABELS[info.category], context.locale) : localized(CATEGORY_LABELS.control, context.locale),
    ))
    .slice(0, 6)
}

function searchSuggestions(prefix: string, context: QuanWenGTerminalCommandContext, rawInput: string) {
  if (!prefix.trim()) return []
  return searchContentIndex(context.contentIndex, prefix, 5).map((entry, index) => suggestion(
    `search:${entry.id}:${index}`,
    prefixedInput(rawInput, `search ${entry.title}`),
    entry.title,
    `${localized(KIND_LABELS[entry.kind], context.locale)} · ${entry.description}`,
    localized(CATEGORY_LABELS.explore, context.locale),
  ))
}

function openSuggestions(prefix: string, context: QuanWenGTerminalCommandContext, rawInput: string) {
  const fromSearch = context.lastSearchResults.map((entry, index) => ({ entry, input: `open ${index + 1}` }))
  const fromIndex = searchContentIndex(context.contentIndex, prefix, 5).map((entry) => ({ entry, input: `open ${entry.id}` }))
  const merged = [...fromSearch, ...fromIndex]
  const seen = new Set<string>()
  return merged
    .filter(({ entry, input }) => {
      if (seen.has(`${entry.id}:${input}`)) return false
      seen.add(`${entry.id}:${input}`)
      return !prefix || normalize(input).includes(normalize(prefix)) || normalize(entry.title).includes(normalize(prefix))
    })
    .slice(0, 6)
    .map(({ entry, input }) => suggestion(
      `open:${input}`,
      prefixedInput(rawInput, input),
      input,
      `${entry.title} · ${localized(KIND_LABELS[entry.kind], context.locale)}`,
      localized(CATEGORY_LABELS.explore, context.locale),
    ))
}

export function getQuanWenGTerminalSuggestions(rawInput: string, context: QuanWenGTerminalCommandContext): QuanWenGTerminalSuggestion[] {
  const rawTrimmed = rawInput.trim()
  const trimmed = stripCommandPrefix(rawInput)
  if (!trimmed) return rawTrimmed.startsWith('/') ? commandSuggestions('', context, rawInput) : topSuggestions(context, rawInput)
  const parsed = parseQuanWenGTerminalCommand(rawInput)
  const endsWithSpace = /\s$/.test(rawInput)
  const command = commandByName(parsed.normalizedCommand)
  const commandName = command?.name || parsed.normalizedCommand
  const hasOnlyCommand = parsed.tokens.length <= 1 && !endsWithSpace
  const isExactCommand = Boolean(command && normalize(command.name) === parsed.normalizedCommand)

  if (hasOnlyCommand && !isExactCommand) return commandSuggestions(parsed.normalizedCommand, context, rawInput)

  const prefix = hasOnlyCommand || endsWithSpace ? '' : parsed.args[parsed.args.length - 1] || ''
  if (commandName === 'help') return helpSuggestions(prefix, context, rawInput)
  if (commandName === 'cd') return cdSuggestions(prefix, context, rawInput)
  if (commandName === 'theme') return fixedArgSuggestions('theme', ['toggle', 'light', 'dark'], context, rawInput, prefix)
  if (commandName === 'lang') return fixedArgSuggestions('lang', ['toggle', 'zh', 'en'], context, rawInput, prefix)
  if (commandName === 'music') return fixedArgSuggestions('music', ['open', 'play', 'pause', 'toggle', 'next', 'prev', 'repeat', 'volume 50'], context, rawInput, prefix)
  if (commandName === 'search') return hasOnlyCommand ? [] : searchSuggestions(parsed.args.join(' '), context, rawInput)
  if (commandName === 'open') return openSuggestions(prefix, context, rawInput)
  return []
}
