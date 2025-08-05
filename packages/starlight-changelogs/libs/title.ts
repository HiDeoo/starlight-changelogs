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

export function getSiteTitle(lang: string | undefined): string {
  if (typeof context.title === 'string') return context.title
  if (lang && context.title[lang]) return context.title[lang]
  return context.title[getDefaultLang()] as string
}
