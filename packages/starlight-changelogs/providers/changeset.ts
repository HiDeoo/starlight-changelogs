import { existsSync, promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'
import { slug } from 'github-slugger'
import type { Node, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'

import type { StarlightChangelogsEntry } from '../loader/schema'
import { throwLoaderError } from '../loader/utils'

import { StarlightChangelogsLoaderBaseConfigSchema } from '.'

export const StarlightChangelogsChangesetLoaderConfigSchema = StarlightChangelogsLoaderBaseConfigSchema.extend({
  // TODO(HiDeoo) comment
  type: z.literal('changeset'),
  // TODO(HiDeoo) comment
  changelog: z.string(),
})

export async function loadChangesetData(config: StarlightChangelogsChangesetLoaderConfig, context: LoaderContext) {
  const { config: astroConfig, logger, watcher } = context

  const path = fileURLToPath(new URL(config.changelog, astroConfig.root))
  if (!existsSync(path)) throwLoaderError(`The provided changelog file ${path} does not exist.`)

  await syncData(path, config, context)

  watcher?.add(path)
  watcher?.on('change', async (changedPath) => {
    if (changedPath === path) {
      logger.info(`Reloading data from ${path}`)
      await syncData(path, config, context)
    }
  })
}

async function syncData(
  path: string,
  config: StarlightChangelogsChangesetLoaderConfig,
  { generateDigest, parseData, renderMarkdown, store }: LoaderContext,
) {
  try {
    const content = await fs.readFile(path, 'utf8')
    const entries = parseMarkdown(config, content)

    for (const entry of entries) {
      const existingEntry = store.get(entry.id)

      const digest = generateDigest({ id: entry.id, content: entry.body })
      if (existingEntry && existingEntry.digest === digest) continue

      const { body, ...data } = entry
      const parsedData = await parseData({ id: entry.id, data })

      store.set({ id: entry.id, body, data: parsedData, digest, rendered: await renderMarkdown(body) })
    }
  } catch (error) {
    throwLoaderError(`Failed to read the changelog file at ${path}`, error)
  }
}

function parseMarkdown(config: StarlightChangelogsChangesetLoaderConfig, content: string) {
  const entries: MarkdownEntry[] = []
  const tree = fromMarkdown(content)

  let version: MarkdownVersion | undefined

  visit(tree, (node) => {
    if (node.type === 'heading' && node.depth === 2) {
      if (version) entries.push(parseMarkdownVersion(config, version))
      version = { id: toString(node), nodes: [] }
      return SKIP
    }

    if (!version) return CONTINUE

    version.nodes.push(node)

    return SKIP
  })

  if (version) entries.push(parseMarkdownVersion(config, version))

  return entries
}

function parseMarkdownVersion(
  config: StarlightChangelogsChangesetLoaderConfig,
  version: MarkdownVersion,
): MarkdownEntry {
  return {
    id: generateEntryId(config, version.id),
    body: toMarkdown({ type: 'root', children: version.nodes as RootContent[] }),
    prefix: config.prefix,
    // TODO(HiDeoo) extract
    slug: slug(version.id.replaceAll('.', ' ')),
    title: version.id,
  }
}

function generateEntryId(config: StarlightChangelogsChangesetLoaderConfig, version: string): string {
  // TODO(HiDeoo) use a constant based on the type of the provider
  return `changeset:${config.prefix}:${version}`
}

type StarlightChangelogsChangesetLoaderConfig = z.output<typeof StarlightChangelogsChangesetLoaderConfigSchema>

interface MarkdownVersion {
  id: string
  nodes: Node[]
}

interface MarkdownEntry extends StarlightChangelogsEntry {
  body: string
}
