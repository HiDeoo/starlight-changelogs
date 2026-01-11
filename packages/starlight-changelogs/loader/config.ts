import fs from 'node:fs/promises'

import type { AstroConfig } from 'astro'
import { z } from 'astro/zod'

import { SerializedProviderBaseConfigSchema, type ProviderBaseConfig } from '../providers'
import { ChangesetProviderConfigSchema } from '../providers/changeset'
import { GiteaProviderConfigSchema } from '../providers/gitea'
import { GitHubProviderConfigSchema } from '../providers/github'
import { KeepAChangelogProviderConfigSchema } from '../providers/keep-a-changelog'

export const StarlightChangelogsLoaderConfigSchema = z
  .discriminatedUnion('provider', [
    ChangesetProviderConfigSchema,
    GiteaProviderConfigSchema,
    GitHubProviderConfigSchema,
    KeepAChangelogProviderConfigSchema,
  ])
  .array()
  .default([])

export function getLoaderConfigUrl(astroConfig: AstroConfig): URL {
  return new URL('.astro/starlight-changelogs.json', astroConfig.root)
}

export async function saveLoaderConfig(astroConfig: AstroConfig, loaderConfig: ProviderBaseConfig[]) {
  const oldConfig = await readLoaderConfig(astroConfig)
  const newConfig = JSON.stringify(loaderConfig)

  if (oldConfig === newConfig) return

  return fs.writeFile(getLoaderConfigUrl(astroConfig), newConfig)
}

export function serializeLoaderConfig(loaderConfig: StarlightChangelogsLoaderConfig): ProviderBaseConfig[] {
  return loaderConfig.map((config) => SerializedProviderBaseConfigSchema.parse(config))
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
