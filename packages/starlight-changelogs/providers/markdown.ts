import { existsSync, promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { getConditionalHeaders, storeConditionalHeaders } from '@ascorbic/loader-utils'
import type { LoaderContext } from 'astro/loaders'
import type { z } from 'astro/zod'
import type { Heading, Node, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'

import { fetchFromLoader } from '../libs/net'
import { throwPluginError } from '../libs/plugin'
import type { VersionDataEntry } from '../loader/schema'
import { slugifyVersion } from '../loader/utils'

import type { ProviderBaseConfigSchema } from '.'

const urlRegex = /^https?:\/\//

export async function loadMarkdownData(config: MarkdownProviderConfig, context: LoaderContext) {
  const { config: astroConfig, logger, watcher } = context

  const isUrlString = urlRegex.test(config.changelog)

  if (isUrlString) {
    await syncData(new URL(config.changelog), config, context)
    return
  }

  const path = fileURLToPath(new URL(config.changelog, astroConfig.root))

  await syncData(path, config, context)

  watcher?.add(path)
  watcher?.on('change', async (changedPath) => {
    if (changedPath !== path) return
    logger.info(`Reloading data from ${path}`)
    await syncData(path, config, context)
  })
}

async function syncData(pathOrUrl: string | URL, config: MarkdownProviderConfig, context: LoaderContext) {
  const { generateDigest, parseData, renderMarkdown, store } = context

  try {
    const result = await getChangelogContent(pathOrUrl, context)
    if (!result.modified) return
    const entries = parseMarkdown(config, result.content)
    const entryIds = new Set(entries.map(({ id }) => id))

    const storedEntries = store.values()
    for (const entry of storedEntries) {
      if (entry.data['base'] === config.base && !entryIds.has(entry.id)) store.delete(entry.id)
    }

    for (const entry of entries) {
      const { id, body, ...data } = entry
      const existingEntry = store.get(id)

      const digest = generateDigest({ id, content: body, data })
      if (existingEntry?.digest === digest) continue

      const parsedData = await parseData({ id, data })

      store.set({ id, body, data: parsedData, digest, rendered: await renderMarkdown(body) })
    }
  } catch (error) {
    throwPluginError(`Failed to read the changelog file at ${pathOrUrl}`, error)
  }
}

async function getChangelogContent(
  pathOrUrl: string | URL,
  { logger, meta }: LoaderContext,
): Promise<ChangelogContent> {
  if (typeof pathOrUrl === 'string') {
    if (!existsSync(pathOrUrl)) throwPluginError(`The provided changelog file path at ${pathOrUrl} does not exist.`)

    const content = await fs.readFile(pathOrUrl, 'utf8')

    return { modified: true, content }
  }

  const headers = new Headers()

  const result = await fetchFromLoader(pathOrUrl, getConditionalHeaders({ init: headers, meta }), logger)
  if (!result.ok) return { modified: false }

  const response = result.response

  if (response.status === 304) return { modified: false }
  if (!response.ok)
    throwPluginError(`Failed to fetch data from ${pathOrUrl}: ${response.status} - ${response.statusText}`)

  try {
    const content = await response.text()
    storeConditionalHeaders({ headers: response.headers, meta })
    return { modified: true, content }
  } catch (error) {
    throwPluginError(`Failed to parse data from ${pathOrUrl}`, error)
  }
}

function parseMarkdown(config: MarkdownProviderConfig, content: string) {
  const entries: VersionDataEntry[] = []
  const tree = fromMarkdown(content)

  let version: MarkdownVersion | undefined

  function addEntry(version: MarkdownVersion, index: number) {
    const parsedVersion = parseMarkdownVersion(config, version, index)
    if (!parsedVersion) return
    if (config.markdown.ignoredVersions?.includes(parsedVersion.title)) return
    entries.push(parsedVersion)
  }

  let versionIndex = 0

  visit(tree, (node) => {
    if (node.type === 'heading') {
      const title = toString(node).trim()

      if (config.markdown.isVersionHeading({ depth: node.depth, title })) {
        if (version) addEntry(version, versionIndex++)
        version = { title, nodes: [] }
        return SKIP
      }
    }

    if (!version) return CONTINUE

    version.nodes.push(node)

    return SKIP
  })

  if (version) addEntry(version, versionIndex)

  return entries
}

function parseMarkdownVersion(
  config: MarkdownProviderConfig,
  version: MarkdownVersion,
  index: number,
): VersionDataEntry | undefined {
  let title = version.title

  const process = config.process

  if (process) {
    const processedTitle = process({ title })
    if (!processedTitle) return
    title = processedTitle
  }

  const processed = config.markdown.process?.({ title: version.title })
  if (!process) title = processed?.title ?? title

  const [id, slug] = slugifyVersion(config, title)

  return {
    id,
    body: toMarkdown({ type: 'root', children: version.nodes as RootContent[] }),
    base: config.base,
    ...(processed?.date && { date: processed.date }),
    index,
    provider: config.provider,
    slug,
    title,
  }
}

export interface MarkdownProviderConfig extends z.output<typeof ProviderBaseConfigSchema> {
  /**
   * The path or URL of the Markdown changelog file to load.
   *
   * When using a path, it should be relative to the root of the Starlight project.
   * When using a URL, it should point to a raw file that contains the changelog, e.g. a GitHub raw URL.
   */
  changelog: string
  /** Markdown-specific configuration options for parsing the changelog. */
  markdown: {
    /** Version titles to ignore when parsing the changelog (applied after `process` function). */
    ignoredVersions?: string[]
    /** A function used to identify version headings. */
    isVersionHeading: (context: MarkdownHeading) => boolean
    /** An optional function called to process data from the original version title. */
    process?: (context: { title: string }) => MarkdownProcessResult
  }
  /** The provider used for the associated changelog. */
  provider: VersionDataEntry['provider']
}

type ChangelogContent = { modified: false } | { modified: true; content: string }

interface MarkdownHeading {
  depth: Heading['depth']
  title: string
}

interface MarkdownProcessResult {
  date?: Date
  title: string
}

interface MarkdownVersion {
  title: string
  nodes: Node[]
}
