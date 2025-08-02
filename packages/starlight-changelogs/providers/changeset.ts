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

import type { VersionEntry } from '../loader/schema'
import { throwLoaderError } from '../loader/utils'

import { ProviderBaseConfigSchema } from '.'

export const ChangesetProviderConfigSchema = ProviderBaseConfigSchema.extend({
  // TODO(HiDeoo) comment
  path: z.string(),
  // TODO(HiDeoo) comment
  provider: z.literal('changeset'),
})

export async function loadChangesetData(config: ChangesetProviderConfig, context: LoaderContext) {
  const { config: astroConfig, logger, watcher } = context

  const path = fileURLToPath(new URL(config.path, astroConfig.root))
  if (!existsSync(path)) throwLoaderError(`The provided changelog file path at ${path} does not exist.`)

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
  config: ChangesetProviderConfig,
  { generateDigest, parseData, renderMarkdown, store }: LoaderContext,
) {
  try {
    const content = await fs.readFile(path, 'utf8')
    const entries = parseMarkdown(config, content)

    for (const entry of entries) {
      const { id, body, ...data } = entry
      const existingEntry = store.get(id)

      const digest = generateDigest({ id, content: body })
      if (existingEntry && existingEntry.digest === digest) continue

      const parsedData = await parseData({ id, data })

      store.set({ id, body, data: parsedData, digest, rendered: await renderMarkdown(body) })
    }
  } catch (error) {
    throwLoaderError(`Failed to read the changelog file at ${path}`, error)
  }
}

function parseMarkdown(config: ChangesetProviderConfig, content: string) {
  const entries: VersionDataEntry[] = []
  const tree = fromMarkdown(content)

  let version: MarkdownVersion | undefined

  visit(tree, (node) => {
    if (node.type === 'heading' && node.depth === 2) {
      if (version) entries.push(parseMarkdownVersion(config, version))
      version = { title: toString(node), nodes: [] }
      return SKIP
    }

    if (!version) return CONTINUE

    version.nodes.push(node)

    return SKIP
  })

  if (version) entries.push(parseMarkdownVersion(config, version))

  return entries
}

function parseMarkdownVersion(config: ChangesetProviderConfig, version: MarkdownVersion): VersionDataEntry {
  // TODO(HiDeoo) extract?
  const versionSlug = slug(version.title.replaceAll('.', ' '))

  return {
    // TODO(HiDeoo) extract?
    id: `${config.base}/version/${versionSlug}`,
    body: toMarkdown({ type: 'root', children: version.nodes as RootContent[] }),
    base: config.base,
    slug: versionSlug,
    title: version.title,
  }
}

type ChangesetProviderConfig = z.output<typeof ChangesetProviderConfigSchema>

interface MarkdownVersion {
  title: string
  nodes: Node[]
}

interface VersionDataEntry extends VersionEntry {
  id: string
  body: string
}
