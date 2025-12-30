import type { LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'

import { loadMarkdownData, type MarkdownProviderConfig } from './markdown'

import { ProviderBaseConfigSchema } from '.'

export const KeepAChangelogProviderConfigSchema = ProviderBaseConfigSchema.extend({
  /**
   * The path or URL of the changelog file using the Keep a Changelog format to load.
   *
   * When using a path, it should be relative to the root of the Starlight project.
   * When using a URL, it should point to a raw file that contains the changelog, e.g. a GitHub raw URL.
   */
  changelog: z.string(),
  /** The type of provider used to load the changelog, `keep-a-changelog` in this case. */
  provider: z.literal('keep-a-changelog'),
})

const provider: MarkdownProviderConfig['provider'] = { name: 'keep-a-changelog', label: 'Keep a Changelog' }
const markdown: MarkdownProviderConfig['markdown'] = {
  ignoredVersions: ['Unreleased'],
  process({ title }) {
    return title.replace(/(?<version>.*?)\s-\s?\d{4}-\d{2}-\d{2}\s*$/, '$<version>')
  },
  versionHeadingLevel: 2,
}

export async function loadKeepAChangelogData(config: KeepAChangelogProviderConfig, context: LoaderContext) {
  await loadMarkdownData({ ...config, markdown, provider }, context)
}

type KeepAChangelogProviderConfig = z.output<typeof KeepAChangelogProviderConfigSchema>
