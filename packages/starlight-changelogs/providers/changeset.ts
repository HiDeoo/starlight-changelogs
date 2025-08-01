import { existsSync, promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'
import type { Node, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { CONTINUE, SKIP, visit } from 'unist-util-visit'

import type { StarlightChangelogsEntry } from '../loader/schema'
import { throwLoaderError } from '../loader/utils'

import { StarlightChangelogsLoaderBaseConfigSchema } from '.'

// TODO(HiDeoo) check how matt tests loaders

export const StarlightChangelogsChangesetLoaderConfigSchema = StarlightChangelogsLoaderBaseConfigSchema.extend({
  // TODO(HiDeoo) comment
  type: z.literal('changeset'),
  // TODO(HiDeoo) comment
  changelog: z.string(),
})

export async function loadChangesetData(config: StarlightChangelogsLoaderConfig, context: LoaderContext) {
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
  config: StarlightChangelogsLoaderConfig,
  { generateDigest, parseData, store }: LoaderContext,
) {
  try {
    const content = await fs.readFile(path, 'utf8')
    const entries = parseChangelog(config, content)

    for (const entry of entries) {
      const existingEntry = store.get(entry.id)

      const digest = generateDigest({ id: entry.id, content: entry.content })
      if (existingEntry && existingEntry.digest === digest) continue

      const parsedData = await parseData({ id: entry.id, data: entry })

      store.set({ id: entry.id, data: parsedData })
    }
  } catch (error) {
    throwLoaderError(`Failed to read the changelog file at ${path}`, error)
  }
}

function parseChangelog(config: StarlightChangelogsLoaderConfig, content: string) {
  const entries: StarlightChangelogsEntry[] = []
  const tree = fromMarkdown(content)

  let version: ChangelogVersion | undefined

  visit(tree, (node) => {
    if (node.type === 'heading' && node.depth === 2) {
      if (version) entries.push(createEntry(config, version))
      version = { id: toString(node), nodes: [] }
      return SKIP
    }

    if (!version) return CONTINUE

    version.nodes.push(node)

    return SKIP
  })

  if (version) entries.push(createEntry(config, version))

  return entries
}

function createEntry(config: StarlightChangelogsLoaderConfig, version: ChangelogVersion): StarlightChangelogsEntry {
  return {
    id: generateEntryId(config, version.id),
    title: version.id,
    content: toMarkdown({ type: 'root', children: version.nodes as RootContent[] }),
  }
}

function generateEntryId(config: StarlightChangelogsLoaderConfig, version: string): string {
  return `changeset:${config.prefix}:${version}`
}

type StarlightChangelogsLoaderConfig = z.output<typeof StarlightChangelogsChangesetLoaderConfigSchema>

interface ChangelogVersion {
  id: string
  nodes: Node[]
}
