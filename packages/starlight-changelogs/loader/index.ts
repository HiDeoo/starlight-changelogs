import type { Loader } from 'astro/loaders'
import { setLoaderConfig } from 'virtual:starlight-changelogs/config'

import { throwPluginError } from '../libs/plugin'
import { saveLoaderConfig, serializeLoaderConfig } from '../loader/config'
import { loadChangesetData } from '../providers/changeset'
import { loadGitHubData } from '../providers/github'

import { StarlightChangelogsLoaderConfigSchema, type StarlightChangelogsLoaderUserConfig } from './config'
import { VersionEntrySchema } from './schema'

export function changelogsLoader(userConfig: StarlightChangelogsLoaderUserConfig): Loader {
  const parsedConfig = StarlightChangelogsLoaderConfigSchema.safeParse(userConfig)

  return {
    name: 'starlight-changelogs',
    load: async (context) => {
      const { config: astroConfig } = context

      if (!parsedConfig.success) {
        throwPluginError(
          `The provided starlight-changelogs loader configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
        )
      }

      const config = parsedConfig.data
      const serializedConfig = serializeLoaderConfig(config)

      setLoaderConfig(serializedConfig)
      await saveLoaderConfig(astroConfig, serializedConfig)

      for (const changelog of config) {
        switch (changelog.provider) {
          case 'changeset': {
            await loadChangesetData(changelog, context)
            break
          }
          case 'github': {
            await loadGitHubData(changelog, context)
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
  }
}
