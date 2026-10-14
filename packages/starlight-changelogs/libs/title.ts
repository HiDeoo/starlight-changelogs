import context from 'virtual:starlight-changelogs/context'

import type { ProviderBaseConfig } from '../providers'

import { getDefaultLang, getI18nLabel, type Locale } from './i18n'

export function getChangelogTitle(changelog: ProviderBaseConfig, locale: Locale): string {
  const title = getI18nLabel(changelog.title, locale)

  if (title.length === 0) {
    throw new Error('The changelog title must have a key for the default language.')
  }

  return title
}

export function getPageTitle(pageTitle: string, changelogTitle: string, lang: string | undefined): string {
  const title = `${pageTitle} ${context.titleDelimiter} ${changelogTitle} ${context.titleDelimiter} ${getSiteTitle(lang)}`
  // Escape the title as Starlight inserts head content as raw HTML.
  return title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
}

function getSiteTitle(lang: string | undefined): string {
  if (typeof context.title === 'string') return context.title
  const localizedTitle = lang ? context.title[lang] : undefined
  if (localizedTitle) return localizedTitle
  return context.title[getDefaultLang()] as string
}
