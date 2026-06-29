export function resolvePublicAssetPath(path: string) {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
