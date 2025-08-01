import type { StarlightChangelogsLoaderBaseConfig } from '../providers'

import { getDefaultLang, getLangFromLocale, type Locale } from './i18n'
import type { VersionProps } from './routing'

export function getChangelogTitle(changelog: StarlightChangelogsLoaderBaseConfig, locale: Locale): string {
  if (typeof changelog.title === 'string') return changelog.title

  let title: string
  const lang = getLangFromLocale(locale)

  if (changelog.title[lang]) {
    title = changelog.title[lang]
  } else {
    const defaultLang = getDefaultLang()
    title = defaultLang ? (changelog.title[defaultLang] ?? '') : ''
  }

  if (title.length === 0) {
    throw new Error('The changelog title must have a key for the default language.')
  }

  return title
}

export function getVersionTitle(
  changelog: StarlightChangelogsLoaderBaseConfig,
  entry: VersionProps['entry'],
  locale: Locale,
) {
  return `${getChangelogTitle(changelog, locale)} - ${entry.data.title}`
}
