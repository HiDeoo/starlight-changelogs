import { getConditionalHeaders, storeConditionalHeaders } from '@ascorbic/loader-utils'
import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'

import { throwPluginError } from '../libs/plugin'
import type { VersionDataEntry } from '../loader/schema'
import { slugifyVersion } from '../loader/utils'

import { ProviderBaseConfigSchema } from '.'

export const GitHubProviderConfigSchema = ProviderBaseConfigSchema.extend({
  /** The owner of the GitHub repository containing releases to load. */
  owner: z.string(),
  /** The type of provider used to load the changelog, `github` in this case. */
  provider: z.literal('github'),
  /** The name of the GitHub repository containing releases to load. */
  repo: z.string(),
  /**
   * An optional GitHub fine-grained access token to use for loading releases.
   * This can be used to access private repositories or to increase the rate limit for public repositories.
   *
   * The token should have the `Contents` repository permission (read).
   *
   * @see https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#list-releases--fine-grained-access-tokens
   */
  token: z.string().optional(),
})

const provider = { name: 'github', label: 'GitHub' } as const

export async function loadGitHubData(config: GitHubProviderConfig, context: LoaderContext) {
  const result = await fetchGitHubReleases(config, context)
  if (!result.modified) return

  await syncData(config, result.entries, context)
}

async function syncData(
  config: GitHubProviderConfig,
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

async function fetchGitHubReleases(config: GitHubProviderConfig, { meta }: LoaderContext): Promise<GitHubApiResult> {
  let page: string | null = '1'
  const entries: VersionDataEntry[] = []

  while (page) {
    const url = new URL(`https://api.github.com/repos/${config.owner}/${config.repo}/releases`)
    url.searchParams.set('page', page)
    url.searchParams.set('per_page', '100')

    const headers = new Headers()
    headers.set('Accept', 'application/vnd.github+json')
    headers.set('X-GitHub-Api-Version', '2022-11-28')
    if (config.token) headers.set('Authorization', `Bearer ${config.token}`)

    const response = await fetch(url, { headers: getConditionalHeaders({ init: headers, meta }) })

    if (response.status === 304) return { modified: false }
    if (!response.ok) throwPluginError(`Failed to fetch GitHub data: ${response.status} - ${response.statusText}`)

    page = getGitHubApiResponseNextPage(response)

    try {
      const data: unknown = await response.json()
      const parsedData = GitHubApiReleasesSchema.parse(data)

      if (!page) storeConditionalHeaders({ headers: response.headers, meta })

      for (const release of parsedData) {
        const parsedVersion = parseGitHubReleaseVersion(config, release)
        if (parsedVersion) entries.push(parsedVersion)
      }
    } catch (error) {
      throwPluginError('Failed to parse GitHub data.', error)
    }
  }

  return entries.length > 0 ? { modified: true, entries } : { modified: false }
}

function getGitHubApiResponseNextPage(response: Response): string | null {
  return response.headers.get('Link')?.match(GitHubApiResponseNextPageRegex)?.[1] ?? null
}

function parseGitHubReleaseVersion(
  config: GitHubProviderConfig,
  release: GitHubApiReleases[number],
): VersionDataEntry | undefined {
  if (release.draft || release.prerelease) return

  let title = release.name

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
    provider,
    slug,
    title,
  }
}

const GitHubApiResponseNextPageRegex = /(?<=<)(?:[\S]*?)[&|?]page=(\d+)(?:[\S]*?)(?=>; rel="next")/i

const GitHubApiReleasesSchema = z
  .object({
    body: z.string(),
    draft: z.boolean(),
    html_url: z.string(),
    name: z.string(),
    prerelease: z.boolean(),
    published_at: z.string().datetime(),
  })
  .array()

type GitHubApiReleases = z.infer<typeof GitHubApiReleasesSchema>
type GitHubApiResult = { modified: false } | { modified: true; entries: VersionDataEntry[] }

type GitHubProviderConfig = z.output<typeof GitHubProviderConfigSchema>
