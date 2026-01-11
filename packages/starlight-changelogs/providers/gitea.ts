import { getConditionalHeaders, storeConditionalHeaders } from '@ascorbic/loader-utils'
import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'

import { fetchFromLoader } from '../libs/net'
import { stripTrailingSlash } from '../libs/path'
import { throwPluginError } from '../libs/plugin'
import type { VersionDataEntry } from '../loader/schema'
import { slugifyVersion } from '../loader/utils'

import { ProviderBaseConfigSchema } from '.'

export const GiteaProviderConfigSchema = ProviderBaseConfigSchema.extend({
  /**
   * The Gitea API endpoint URL to use for loading releases.
   *
   * @default 'https://gitea.com/api/v1'
   */
  api: z.string().url().default('https://gitea.com/api/v1').transform(stripTrailingSlash),
  /** The owner of the Gitea repository containing releases to load. */
  owner: z.string(),
  /** The type of provider used to load the changelog, `gitea` in this case. */
  provider: z.literal('gitea'),
  /**
   * An optional label to use for the provider instead of the default one.
   *
   * This can be useful when using a provider with a Gitea-compatible API like Codeberg. Such label is used in some
   * parts of the UI to link to the provider website.
   *
   * @default 'Gitea'
   */
  providerLabel: z.string().default('Gitea'),
  /** The name of the Gitea repository containing releases to load. */
  repo: z.string(),
  /**
   * An optional Gitea API token to use for loading releases which can be used to access private repositories.
   *
   * The token should have the `repository` permission (read).
   *
   * @see https://docs.gitea.com/development/api-usage#generating-and-listing-api-tokens
   */
  token: z.string().optional(),
})

const provider = { name: 'gitea', label: 'Gitea' } as const

export async function loadGiteaData(config: GiteaProviderConfig, context: LoaderContext) {
  const result = await fetchGiteaReleases(config, context)
  if (!result.modified) return

  await syncData(config, result.entries, context)
}

async function syncData(
  config: GiteaProviderConfig,
  entries: VersionDataEntry[],
  { parseData, renderMarkdown, store }: LoaderContext,
) {
  // Delete all existing entries in the store for this provider/base combination
  for (const entry of store.values()) {
    if (entry.data['base'] === config.base) store.delete(entry.id)
  }

  for (const entry of entries) {
    const { id, body, ...data } = entry

    const parsedData = await parseData({ id, data })

    store.set({ id, body, data: parsedData, rendered: await renderMarkdown(body) })
  }
}

async function fetchGiteaReleases(
  config: GiteaProviderConfig,
  { logger, meta }: LoaderContext,
): Promise<GiteaApiResult> {
  let page: string | null = '1'
  const entries: VersionDataEntry[] = []

  while (page) {
    const url = new URL(`${config.api}/repos/${config.owner}/${config.repo}/releases`)
    url.searchParams.set('page', page)
    url.searchParams.set('limit', '50')

    const headers = new Headers()
    headers.set('Accept', 'application/json')
    if (config.token) headers.set('Authorization', `token ${config.token}`)

    const result = await fetchFromLoader(url, getConditionalHeaders({ init: headers, meta }), logger)
    if (!result.ok) return { modified: true, entries: [] }

    const response = result.response

    if (!response.ok) throwPluginError(`Failed to fetch Gitea data: ${response.status} - ${response.statusText}`)

    page = getGiteaApiResponseNextPage(response)

    try {
      const data: unknown = await response.json()
      const parsedData = GiteaApiReleasesSchema.parse(data)

      if (!page) storeConditionalHeaders({ headers: response.headers, meta })

      for (const release of parsedData) {
        const parsedVersion = parseGiteaReleaseVersion(config, release)
        if (parsedVersion) entries.push(parsedVersion)
      }
    } catch (error) {
      throwPluginError('Failed to parse Gitea data.', error)
    }
  }

  return entries.length > 0 ? { modified: true, entries } : { modified: false }
}

function getGiteaApiResponseNextPage(response: Response): string | null {
  return response.headers.get('Link')?.match(GiteaApiResponseNextPageRegex)?.[1] ?? null
}

function parseGiteaReleaseVersion(
  config: GiteaProviderConfig,
  release: GiteaApiReleases[number],
): VersionDataEntry | undefined {
  if (release.draft || release.prerelease) return

  let title = release.name ?? release.tag_name

  if (config.process) {
    const processedTitle = config.process({ title })
    if (!processedTitle) return
    title = processedTitle
  }

  const [id, slug] = slugifyVersion(config, title)

  return {
    id,
    body: release.body,
    base: config.base,
    date: release.published_at ? new Date(release.published_at) : undefined,
    link: release.html_url,
    provider: config.providerLabel ? { ...provider, label: config.providerLabel } : provider,
    slug,
    title,
  }
}

const GiteaApiResponseNextPageRegex = /(?<=<)(?:[\S]*?)[&|?]page=(\d+)(?:[\S]*?)(?=>; rel="next")/i

const GiteaApiReleasesSchema = z
  .object({
    body: z.string(),
    draft: z.boolean(),
    html_url: z.string(),
    name: z.string().nullable(),
    prerelease: z.boolean(),
    published_at: z.string().datetime({ offset: true }),
    tag_name: z.string(),
  })
  .array()

type GiteaApiReleases = z.infer<typeof GiteaApiReleasesSchema>
type GiteaApiResult = { modified: false } | { modified: true; entries: VersionDataEntry[] }

type GiteaProviderConfig = z.output<typeof GiteaProviderConfigSchema>
