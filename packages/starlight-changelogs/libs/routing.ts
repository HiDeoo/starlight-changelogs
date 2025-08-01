import type { GetStaticPathsResult } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'
import context from 'virtual:starlight-changelogs/context'

import type { StarlightChangelogsLoaderBaseConfig } from '../providers'

import { getPathWithLocale, type Locale } from './i18n'
import { getLink, type PaginationLinks } from './link'

const config = getLoaderConfig()

export async function getChangelogsStaticPaths() {
  const paths = []

  for (const changelog of config) {
    for (const localeKey of Object.keys(context.locales ?? { root: undefined })) {
      const locale = localeKey === 'root' ? undefined : localeKey

      const entries = await getChangelogEntries(changelog, locale)
      const pages = getPaginatedChangelogEntries(changelog, entries)

      for (const [index, entries] of pages.entries()) {
        paths.push(getChangelogStaticPath(changelog, pages, entries, index, locale))

        for (const entry of entries) {
          paths.push(getVersionStaticPath(entry, locale))
        }
      }
    }
  }

  return paths satisfies GetStaticPathsResult
}

async function getChangelogEntries(changelog: ChangelogConfig, locale: Locale): Promise<ChangelogEntry[]> {
  // TODO(HiDeoo) sort?
  const entries = await getCollection('changelogs', ({ data }) => data.prefix === changelog.prefix)

  return entries.map((entry, index) => {
    const prevEntry = entries.at(index - 1)
    const prevLink = prevEntry ? { label: 'XXXXX', link: getLink(getVersionPath(prevEntry, locale)) } : undefined

    const nextEntry = entries.at(index + 1)
    const nextLink = nextEntry ? { label: 'XXX', link: getLink(getVersionPath(nextEntry, locale)) } : undefined

    // TODO(HiDeoo)
    return {
      // TODO(HiDeoo)
      ...entry,
      pagination: {
        next: nextLink,
        prev: prevLink,
      },
    }
  })
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
    ? // TODO(HiDeoo) i18n? Use a middleware to generate the label?
      // TODO(HiDeoo) label
      { label: `Page ${index}`, link: getLink(getChangelogPath(changelog, locale, index - 1)) }
    : undefined

  const nextPage = pages.at(index + 1)
  const nextLink = nextPage
    ? // TODO(HiDeoo) label
      { label: `Page ${index + 2}`, link: getLink(getChangelogPath(changelog, locale, index + 1)) }
    : undefined

  return {
    params: {
      slug: getChangelogPath(changelog, locale, index),
    },
    props: {
      type: 'changelog',
      entries,
      locale,
      pagination: {
        next: nextLink,
        prev: prevLink,
      },
    } satisfies StarlightChangelogsStaticProps,
  }
}

function getVersionStaticPath(entry: ChangelogEntry, locale: Locale) {
  // TODO(HiDeoo) next/prev links ?

  return {
    params: {
      slug: getVersionPath(entry, locale),
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

export function getVersionPath(entry: CollectionEntry<'changelogs'>, locale: Locale) {
  return `${getPathWithLocale(entry.data.prefix, locale)}/version/${entry.data.slug}`
}

type ChangelogConfig = StarlightChangelogsLoaderBaseConfig

type ChangelogEntry = CollectionEntry<'changelogs'> & {
  pagination: PaginationLinks
}

export interface ChangelogProps {
  type: 'changelog'
  entries: ChangelogEntry[]
  locale: Locale
  pagination: PaginationLinks
}

export interface VersionProps {
  type: 'version'
  entry: ChangelogEntry
}

type StarlightChangelogsStaticProps = ChangelogProps | VersionProps
