import type { GetStaticPathsResult } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'
import context from 'virtual:starlight-changelogs/context'

import type { ProviderBaseConfig } from '../providers'

import { getPathWithLocale, type Locale } from './i18n'
import { getLink, type PaginationLinks } from './link'

const config = getLoaderConfig()

export async function getChangelogsStaticPaths() {
  const paths = []

  for (const changelog of config) {
    for (const localeKey of Object.keys(context.locales ?? { root: undefined })) {
      const locale = localeKey === 'root' ? undefined : localeKey

      const entries = await getVersionEntries(changelog, locale)
      const pages = getPaginatedVersionEntries(changelog, entries)
      const versions = getAllVersions(entries, locale)

      for (const [index, entries] of pages.entries()) {
        paths.push(getVersionsStaticPath(changelog, pages, entries, index, locale, versions))

        for (const entry of entries) {
          paths.push(getVersionStaticPath(changelog, entry, locale, versions))
        }
      }
    }
  }

  return paths satisfies GetStaticPathsResult
}

function getAllVersions(entries: ChangelogEntry[], locale: Locale): CommonProps['versions'] {
  return entries.map((entry) => ({
    link: getLink(getVersionPath(entry, locale)),
    title: entry.data.title,
  }))
}

async function getVersionEntries(changelog: ProviderBaseConfig, locale: Locale): Promise<ChangelogEntry[]> {
  const entries = await getCollection('changelogs', ({ data }) => data.base === changelog.base)

  return entries.map((entry, index) => {
    const prevEntry = entries[index - 1]
    const prevLink = prevEntry
      ? { label: prevEntry.data.title, link: getLink(getVersionPath(prevEntry, locale)) }
      : undefined

    const nextEntry = entries[index + 1]
    const nextLink = nextEntry
      ? { label: nextEntry.data.title, link: getLink(getVersionPath(nextEntry, locale)) }
      : undefined

    return {
      ...entry,
      pagination: {
        next: nextLink,
        prev: prevLink,
      },
    }
  })
}

function getPaginatedVersionEntries(changelog: ProviderBaseConfig, entries: ChangelogEntry[]) {
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

function getVersionsStaticPath(
  changelog: ProviderBaseConfig,
  pages: ChangelogEntry[][],
  entries: ChangelogEntry[],
  index: number,
  locale: Locale,
  versions: CommonProps['versions'],
) {
  const prevPage = index === 0 ? undefined : pages[index - 1]
  const prevLink = prevPage
    ? { label: 'Newer versions', link: getLink(getVersionsPath(changelog, locale, index - 1)) }
    : undefined

  const nextPage = pages[index + 1]
  const nextLink = nextPage
    ? { label: 'Older versions', link: getLink(getVersionsPath(changelog, locale, index + 1)) }
    : undefined

  return {
    params: {
      slug: getVersionsPath(changelog, locale, index),
    },
    props: {
      type: 'versions',
      changelog,
      entries,
      locale,
      pagination: {
        next: nextLink,
        prev: prevLink,
      },
      versions,
    } satisfies StaticProps,
  }
}

function getVersionStaticPath(
  changelog: ProviderBaseConfig,
  entry: ChangelogEntry,
  locale: Locale,
  versions: CommonProps['versions'],
) {
  return {
    params: {
      slug: getVersionPath(entry, locale),
    },
    props: {
      type: 'version',
      changelog,
      entry,
      locale,
      versions,
    } satisfies StaticProps,
  }
}

export function getVersionsPath(changelog: ProviderBaseConfig, locale: Locale, index?: number) {
  return index ? `${getPathWithLocale(changelog.base, locale)}/${index + 1}` : getPathWithLocale(changelog.base, locale)
}

export function getVersionPath(entry: CollectionEntry<'changelogs'>, locale: Locale) {
  return getPathWithLocale(entry.id, locale)
}

type ChangelogEntry = CollectionEntry<'changelogs'> & {
  pagination: PaginationLinks
}

export interface CommonProps {
  changelog: ProviderBaseConfig
  locale: Locale
  versions: { link: string; title: string }[]
}

export interface VersionsProps extends CommonProps {
  type: 'versions'
  entries: ChangelogEntry[]
  pagination: PaginationLinks
}

export interface VersionProps extends CommonProps {
  type: 'version'
  entry: ChangelogEntry
}

type StaticProps = VersionsProps | VersionProps
