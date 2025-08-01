import type { GetStaticPathsResult } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'
import context from 'virtual:starlight-changelogs/context'

import type { StarlightChangelogsLoaderBaseConfig } from '../providers'

import { getPathWithLocale, type Locale } from './i18n'

const config = getLoaderConfig()

export async function getChangelogsStaticPaths() {
  const paths = []

  for (const changelog of config) {
    const entries = await getChangelogEntries(changelog)
    const pages = getPaginatedChangelogEntries(changelog, entries)

    for (const localeKey of Object.keys(context.locales ?? { root: undefined })) {
      const locale = localeKey === 'root' ? undefined : localeKey

      for (const [index, entries] of pages.entries()) {
        paths.push(getChangelogStaticPath(changelog, entries, index, locale))
      }

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

function getChangelogStaticPath(changelog: ChangelogConfig, entries: ChangelogEntry[], index: number, locale: Locale) {
  // TODO(HiDeoo) next/prev links

  return {
    params: {
      slug:
        index === 0
          ? getPathWithLocale(changelog.prefix, locale)
          : `${getPathWithLocale(changelog.prefix, locale)}/${index + 1}`,
    },
    props: {
      type: 'changelog',
      entries,
    } satisfies StarlightChangelogsStaticProps,
  }
}

function getVersionStaticPath(changelog: ChangelogConfig, entry: ChangelogEntry, locale: Locale) {
  // TODO(HiDeoo) next/prev links ?

  return {
    params: {
      slug: `${getPathWithLocale(changelog.prefix, locale)}/version/${entry.data.slug}`,
    },
    props: {
      type: 'version',
      entry,
    } satisfies StarlightChangelogsStaticProps,
  }
}

type ChangelogEntry = CollectionEntry<'changelogs'>
type ChangelogConfig = StarlightChangelogsLoaderBaseConfig

type StarlightChangelogsStaticProps =
  | {
      type: 'changelog'
      entries: ChangelogEntry[]
    }
  | {
      type: 'version'
      entry: ChangelogEntry
    }
