import { getConditionalHeaders, storeConditionalHeaders } from '@ascorbic/loader-utils'
import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'

import type { VersionDataEntry } from '../loader/schema'
import { slugifyVersion, throwLoaderError } from '../loader/utils'

import { ProviderBaseConfigSchema } from '.'

export const GitHubProviderConfigSchema = ProviderBaseConfigSchema.extend({
  // TODO(HiDeoo) comment
  owner: z.string(),
  // TODO(HiDeoo) comment
  repo: z.string(),
  // TODO(HiDeoo) comment
  provider: z.literal('github'),
})

const provider = { name: 'github', label: 'GitHub' } as const

export async function loadGitHubData(config: GitHubProviderConfig, context: LoaderContext) {
  const result = await fetchGitHubReleases(config, context)
  if (!result.modified) return

  await syncData(result.entries, context)
}

async function syncData(entries: VersionDataEntry[], { parseData, renderMarkdown, store }: LoaderContext) {
  store.clear()

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
    // TODO(HiDeoo)
    // headers.set('Authorization', 'Bearer <YOUR-TOKEN>')

    const response = await fetch(url, { headers: getConditionalHeaders({ init: headers, meta }) })

    if (response.status === 304) return { modified: false }
    if (!response.ok) throwLoaderError(`Failed to fetch GitHub data: ${response.status} - ${response.statusText}`)

    page = getGitHubApiResponseNextPage(response)

    try {
      const data: unknown = await response.json()
      const parsedData = GitHubApiReleasesSchema.parse(data)

      storeConditionalHeaders({ headers: response.headers, meta })

      for (const release of parsedData) {
        const parsedVersion = parseGitHubReleaseVersion(config, release)
        if (parsedVersion) entries.push(parsedVersion)
      }
    } catch (error) {
      throwLoaderError('Failed to parse GitHub data.', error)
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
    link: release.html_url,
    provider,
    slug,
    title,
  }
}

const GitHubApiResponseNextPageRegex = /(?<=<)(?:[\S]*?)[&|?]page=(\d+)(?:[\S]*?)(?=>; rel="next")/i

// TODO(HiDeoo) unhandled fields
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
