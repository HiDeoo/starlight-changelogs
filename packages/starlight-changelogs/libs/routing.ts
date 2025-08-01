import type { GetStaticPathsResult } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'
import context from 'virtual:starlight-changelogs/context'

import type { StarlightChangelogsLoaderBaseConfig } from '../providers'

import { getPathWithLocale, type Locale } from './i18n'
import { getUrl } from './url'

const config = getLoaderConfig()

export async function getChangelogsStaticPaths() {
  const paths = []

  for (const changelog of config) {
    const entries = await getChangelogEntries(changelog)
    const pages = getPaginatedChangelogEntries(changelog, entries)

    for (const localeKey of Object.keys(context.locales ?? { root: undefined })) {
      const locale = localeKey === 'root' ? undefined : localeKey

      for (const [index, entries] of pages.entries()) {
        paths.push(getChangelogStaticPath(changelog, pages, entries, index, locale))
      }

      // TODO(HiDeoo) refactor in a single loop?
      for (const entry of entries) {
        paths.push(getVersionStaticPath(changelog, entry, locale))
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

function getChangelogStaticPath(
  changelog: ChangelogConfig,
  pages: ChangelogEntry[][],
  entries: ChangelogEntry[],
  index: number,
  locale: Locale,
) {
  const prevPage = index === 0 ? undefined : pages.at(index - 1)
  const prevLink = prevPage
    ? // TODO(HiDeoo) label
      { label: `Page ${index}`, link: getUrl(getChangelogPath(changelog, locale, index - 1)) }
    : undefined

  const nextPage = pages.at(index + 1)
  const nextLink = nextPage
    ? // TODO(HiDeoo) label
      { label: `Page ${index + 2}`, link: getUrl(getChangelogPath(changelog, locale, index + 1)) }
    : undefined

  return {
    params: {
      slug: getChangelogPath(changelog, locale, index),
    },
    props: {
      type: 'changelog',
      entries,
      pagination: {
        next: nextLink,
        prev: prevLink,
      },
    } satisfies StarlightChangelogsStaticProps,
  }
}

function getVersionStaticPath(changelog: ChangelogConfig, entry: ChangelogEntry, locale: Locale) {
  // TODO(HiDeoo) next/prev links ?

  return {
    params: {
      // TODO(HiDeoo) see if refactor this one
      slug: `${getPathWithLocale(changelog.prefix, locale)}/version/${entry.data.slug}`,
    },
    props: {
      type: 'version',
      entry,
    } satisfies StarlightChangelogsStaticProps,
  }
}

function getChangelogPath(changelog: ChangelogConfig, locale: Locale, index?: number) {
  return index
    ? `${getPathWithLocale(changelog.prefix, locale)}/${index + 1}`
    : getPathWithLocale(changelog.prefix, locale)
}

type ChangelogEntry = CollectionEntry<'changelogs'>
type ChangelogConfig = StarlightChangelogsLoaderBaseConfig

interface PaginationLink {
  label: string
  link: string
}

interface PaginationLinks {
  next: PaginationLink | undefined
  prev: PaginationLink | undefined
}

export interface ChangelogProps {
  type: 'changelog'
  entries: ChangelogEntry[]
  pagination: PaginationLinks
}

export interface VersionProps {
  type: 'version'
  entry: ChangelogEntry
}

type StarlightChangelogsStaticProps = ChangelogProps | VersionProps
