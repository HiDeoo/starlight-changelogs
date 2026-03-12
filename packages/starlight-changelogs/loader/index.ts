import type { Loader } from 'astro/loaders'
import { z } from 'astro/zod'
import { setLoaderConfig } from 'virtual:starlight-changelogs/config'

import { throwPluginError } from '../libs/plugin'
import { saveLoaderConfig, serializeLoaderConfig } from '../loader/config'
import { loadChangesetData } from '../providers/changeset'
import { loadGiteaData } from '../providers/gitea'
import { loadGitHubData } from '../providers/github'
import { loadKeepAChangelogData } from '../providers/keep-a-changelog'

import { StarlightChangelogsLoaderConfigSchema, type StarlightChangelogsLoaderUserConfig } from './config'
import { VersionEntrySchema } from './schema'

export function changelogsLoader(userConfig: StarlightChangelogsLoaderUserConfig) {
  const parsedConfig = StarlightChangelogsLoaderConfigSchema.safeParse(userConfig)

  return {
    name: 'starlight-changelogs',
    load: async (context) => {
      const { config: astroConfig } = context

      if (!parsedConfig.success) {
        throwPluginError(`Invalid starlight-changelogs loader configuration:

${z.prettifyError(parsedConfig.error)}
`)
      }

      const config = parsedConfig.data
      const serializedConfig = serializeLoaderConfig(config)

      setLoaderConfig(serializedConfig)
      await saveLoaderConfig(astroConfig, serializedConfig)

      for (const changelog of config) {
        if (!changelog.enabled) continue

        switch (changelog.provider) {
          case 'changeset': {
            await loadChangesetData(changelog, context)
            break
          }
          case 'gitea': {
            await loadGiteaData(changelog, context)
            break
          }
          case 'github': {
            await loadGitHubData(changelog, context)
            break
          }
          case 'keep-a-changelog': {
            await loadKeepAChangelogData(changelog, context)
            break
          }
          default: {
            throwPluginError(
              // @ts-expect-error - error when all known providers are supported.
              `Missing loader implementation for provider '${changelog.provider}'. This is a bug in the starlight-changelogs plugin.`,
            )
          }
        }
      }
    },
    schema: VersionEntrySchema,
  } satisfies Loader
}
