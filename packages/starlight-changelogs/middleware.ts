import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data'
import { AstroError } from 'astro/errors'
import { getCollection } from 'astro:content'
import { getLoaderConfig } from 'virtual:starlight-changelogs/config'

import { getI18nLabel, getPathWithLocale, type Locale } from './libs/i18n'
import { getLink } from './libs/link'
import { stripLeadingAndTrailingSlash } from './libs/path'
import type { SidebarLinkConfig } from './libs/sidebar'

const entries = await getCollection('changelogs')

export const onRequest = defineRouteMiddleware(({ locals, url }) => {
  const { starlightRoute } = locals

  starlightRoute.sidebar = updateSidebar(url, starlightRoute.sidebar, starlightRoute.locale)

  if (starlightRoute.pagination.prev) updatePaginationLink(starlightRoute.pagination.prev, starlightRoute.locale)
  if (starlightRoute.pagination.next) updatePaginationLink(starlightRoute.pagination.next, starlightRoute.locale)
})

function updatePaginationLink(link: NonNullable<StarlightRouteData['pagination']['prev']>, locale: Locale) {
  const config = getChangelogsSidebarLinkConfig(link, locale)
  if (!config || config.type === 'recent') return

  link.label = config.label
}

function updateSidebar(url: URL, items: StarlightRouteData['sidebar'], locale: Locale): StarlightRouteData['sidebar'] {
  const updatedItems: StarlightRouteData['sidebar'] = []

  for (const item of items) {
    if (item.type === 'group') {
      updatedItems.push({ ...item, entries: updateSidebar(url, item.entries, locale) })
      continue
    }

    const config = getChangelogsSidebarLinkConfig(item, locale)
    if (!config) {
      updatedItems.push(item)
      continue
    }

    const loaderConfig = getLoaderConfig().find((loaderConfig) => loaderConfig.base === config.base)
    if (!loaderConfig) {
      throw new AstroError(
        `The changelog base "${config.base}" used in sidebar links does not match any changelog loader \`base\` configuration.`,
      )
    }

    if (config.type === 'recent') {
      const baseEntries = entries.filter((entry) => entry.data.base === config.base)
      updatedItems.push(
        ...baseEntries.slice(0, config.count).map((entry) => {
          const href = getLink(getPathWithLocale(entry.id, locale))
          return {
            ...item,
            attrs: {},
            href,
            label: entry.data.title,
            isCurrent: stripLeadingAndTrailingSlash(url.pathname) === stripLeadingAndTrailingSlash(href),
          }
        }),
      )
      continue
    }

    let href = getLink(getPathWithLocale(config.base, locale))

    if (config.type === 'latest') {
      const latestEntry = entries.find((entry) => entry.data.base === config.base)
      if (latestEntry) href = getLink(getPathWithLocale(latestEntry.id, locale))
    }

    updatedItems.push({
      ...item,
      attrs: {},
      href,
      label: config.label,
      isCurrent: stripLeadingAndTrailingSlash(url.pathname) === stripLeadingAndTrailingSlash(href),
    })
  }

  return updatedItems
}

function getChangelogsSidebarLinkConfig(link: SidebarLink, locale: Locale): ChangelogsSidebarLink | undefined {
  const base: unknown = link.attrs['data-sl-changelogs-link-base']
  if (!base || typeof base !== 'string') return undefined

  const type: unknown = link.attrs['data-sl-changelogs-link-type']

  if (type === 'recent') {
    const count = Number(link.attrs['data-sl-changelogs-link-count'])
    return { base, count, type }
  } else if (type === 'all' || type === 'latest') {
    let label = link.label

    try {
      const labels = JSON.parse(link.label) as Record<string, string>
      label = getI18nLabel(labels, locale)
    } catch {
      // If we fail to parse, the label is a string that should be used for all locales.
    }

    return { base, label, type }
  }

  return undefined
}

type ChangelogsRecentSidebarLink = Extract<SidebarLinkConfig[number], { type: 'recent' }>
type ChangelogsAllOrLatestSidebarLink = Omit<
  Extract<SidebarLinkConfig[number], { type: 'all' | 'latest' }>,
  'label'
> & {
  label: string
}
type ChangelogsSidebarLink = ChangelogsRecentSidebarLink | ChangelogsAllOrLatestSidebarLink

type SidebarLink = Extract<StarlightRouteData['sidebar'][number], { type: 'link' }>
