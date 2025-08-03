import fs from 'node:fs/promises'

import type { AstroConfig } from 'astro'
import { z } from 'astro/zod'

import { ChangesetProviderConfigSchema } from '../providers/changeset'
import { GitHubProviderConfigSchema } from '../providers/github'

export const StarlightChangelogsLoaderConfigSchema = z
  .discriminatedUnion('provider', [ChangesetProviderConfigSchema, GitHubProviderConfigSchema])
  .array()
  .default([])

export function getLoaderConfigUrl(astroConfig: AstroConfig): URL {
  return new URL('.astro/starlight-changelogs.json', astroConfig.root)
}

export async function saveLoaderConfig(astroConfig: AstroConfig, loaderConfig: StarlightChangelogsLoaderConfig) {
  const oldConfig = await readLoaderConfig(astroConfig)
  const newConfig = JSON.stringify(loaderConfig)

  if (oldConfig === newConfig) return

  return fs.writeFile(getLoaderConfigUrl(astroConfig), newConfig)
}

async function readLoaderConfig(astroConfig: AstroConfig): Promise<string> {
  try {
    return await fs.readFile(getLoaderConfigUrl(astroConfig), 'utf8')
  } catch {
    // Return an empty config if the file does not exist.
    return '[]'
  }
}

export type StarlightChangelogsLoaderUserConfig = z.input<typeof StarlightChangelogsLoaderConfigSchema>
export type StarlightChangelogsLoaderConfig = z.output<typeof StarlightChangelogsLoaderConfigSchema>
