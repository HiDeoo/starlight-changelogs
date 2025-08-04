import { AstroError } from 'astro/errors'
import context from 'virtual:starlight-changelogs/context'

import { stripTrailingSlash } from './path'

export function getI18nLabel(i18nLabel: string | Record<string, string>, locale: Locale): string {
  if (typeof i18nLabel === 'string') return i18nLabel

  let label: string
  const lang = getLangFromLocale(locale)

  if (i18nLabel[lang]) {
    label = i18nLabel[lang]
  } else {
    const defaultLang = getDefaultLang()
    label = defaultLang ? (i18nLabel[defaultLang] ?? '') : ''
  }

  if (label.length === 0) {
    throw new AstroError('Missing label for the default language.')
  }

  return label
}

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
