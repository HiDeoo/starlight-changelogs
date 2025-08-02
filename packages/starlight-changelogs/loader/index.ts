import type { Loader } from 'astro/loaders'
import { setLoaderConfig } from 'virtual:starlight-changelogs/config'

import { saveLoaderConfig } from '../loader/config'
import { loadChangesetData } from '../providers/changeset'

import { StarlightChangelogsLoaderConfigSchema, type StarlightChangelogsLoaderUserConfig } from './config'
import { VersionEntrySchema } from './schema'
import { throwLoaderError } from './utils'

export function changelogsLoader(userConfig: StarlightChangelogsLoaderUserConfig): Loader {
  const parsedConfig = StarlightChangelogsLoaderConfigSchema.safeParse(userConfig)

  return {
    name: 'starlight-changelogs',
    load: async (context) => {
      const { config: astroConfig } = context

      if (!parsedConfig.success) {
        throwLoaderError(
          `The provided starlight-changelogs loader configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
        )
      }

      const config = parsedConfig.data

      setLoaderConfig(config)
      await saveLoaderConfig(astroConfig, config)

      for (const changelog of config) {
        switch (changelog.provider) {
          case 'changeset': {
            await loadChangesetData(changelog, context)
            break
          }
          default: {
            throwLoaderError(
              `Missing loader implementation for changelog type '${changelog.provider}'. This is a bug in the starlight-changelogs plugin.`,
            )
          }
        }
      }
    },
    schema: VersionEntrySchema,
  }
}
