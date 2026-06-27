import type { LocalizedText, Locale } from '../types/content'

export function textByLocale(text: LocalizedText, locale: Locale) {
  return text[locale] || text.zh
}
