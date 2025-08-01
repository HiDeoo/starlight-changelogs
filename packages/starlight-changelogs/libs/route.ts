import type { GetStaticPathsResult } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'
import context from 'virtual:starlight-changelogs/context'

import type { StarlightChangelogsLoaderBaseConfig } from '../providers'

import { stripTrailingSlash } from './path'

const config = getLoaderConfig()

export async function getChangelogsStaticPaths() {
  const paths = []

  for (const changelog of config) {
    const entries = await getChangelogEntries(changelog)
    const pages = getPaginatedChangelogEntries(changelog, entries)

    for (const localeKey of Object.keys(context.locales ?? { root: undefined })) {
      const locale = localeKey === 'root' ? undefined : localeKey

      for (const [index] of pages.entries()) {
        paths.push(getChangelogStaticPath(changelog, index, locale))
      }
    }
  }

  return paths satisfies GetStaticPathsResult
}

async function getChangelogEntries(changelog: ChangelogConfig): Promise<ChangelogEntry[]> {
  // TODO(HiDeoo) sort?
  return getCollection('changelogs', ({ data }) => data.prefix === changelog.prefix)
}

function getPaginatedChangelogEntries(changelog: ChangelogConfig, entries: ChangelogEntry[]) {
  const pages: ChangelogEntry[][] = []

  for (const entry of entries) {
    const lastPage = pages.at(-1)

    if (!lastPage || lastPage.length === changelog.pageSize) {
      pages.push([entry])
    } else {
      lastPage.push(entry)
    }
  }

  if (pages.length === 0) {
    pages.push([])
  }

  return pages
}

function getChangelogStaticPath(changelog: ChangelogConfig, index: number, locale: Locale) {
  // TODO(HiDeoo) next/prev links

  return {
    params: {
      slug:
        index === 0
          ? getPathWithLocale(changelog.prefix, locale)
          : `${getPathWithLocale(changelog.prefix, locale)}/${index + 1}`,
    },
    // TODO(HiDeoo) props
  }
}

function getPathWithLocale(path: string, locale: Locale): string {
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

type ChangelogEntry = CollectionEntry<'changelogs'>
type ChangelogConfig = StarlightChangelogsLoaderBaseConfig
