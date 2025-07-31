import type { Loader } from 'astro/loaders'
import { setLoaderConfig } from 'virtual:starlight-changelogs/config'

import { saveLoaderConfig } from '../loader/config'
import { loadChangesetData } from '../providers/changeset'

import { StarlightChangelogsLoaderConfigSchema, type StarlightChangelogsLoaderUserConfig } from './config'
import { StarlightChangelogsEntrySchema } from './schema'
import { throwLoaderError } from './utils'

export function changelogsLoader(userConfig: StarlightChangelogsLoaderUserConfig): Loader {
  const parsedConfig = StarlightChangelogsLoaderConfigSchema.safeParse(userConfig)

  return {
    name: 'starlight-changelogs-loader',
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
        switch (changelog.type) {
          case 'changeset': {
            await loadChangesetData(changelog, context)
            break
          }
          default: {
            throwLoaderError(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              `Missing loader implementation for changelog type '${changelog.type}'. This is a bug in the starlight-changelogs plugin.`,
            )
          }
        }
      }
    },
    schema: StarlightChangelogsEntrySchema,
  }
}
