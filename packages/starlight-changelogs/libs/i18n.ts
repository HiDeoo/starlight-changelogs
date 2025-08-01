import context from 'virtual:starlight-changelogs/context'

import { stripTrailingSlash } from './path'

export function getPathWithLocale(path: string, locale: Locale): string {
  const pathLocale = getLocaleFromPath(path)
  if (pathLocale === locale) return path
  locale = locale ?? ''
  if (pathLocale === path) return locale
  if (pathLocale) return stripTrailingSlash(path.replace(`${pathLocale}/`, locale ? `${locale}/` : ''))
  return path ? `${locale}/${path}` : locale
}

export function getLangFromLocale(locale: Locale): string {
  const lang = locale ? context.locales?.[locale]?.lang : context.locales?.root?.lang
  if (lang) return lang
  if (locale) return locale
  return getDefaultLang()
}

export function getDefaultLang() {
  let defaultLang: string | undefined
  if (context.defaultLocale) defaultLang = context.locales?.[context.defaultLocale]?.lang ?? context.defaultLocale
  return defaultLang ?? 'en'
}

function getLocaleFromPath(path: string): Locale {
  const baseSegment = path.split('/')[0]
  return context.locales && baseSegment && baseSegment in context.locales ? baseSegment : undefined
}

export type Locale = string | undefined
