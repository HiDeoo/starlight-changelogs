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

function getLocaleFromPath(path: string): Locale {
  const baseSegment = path.split('/')[0]
  return context.locales && baseSegment && baseSegment in context.locales ? baseSegment : undefined
}

export type Locale = string | undefined
