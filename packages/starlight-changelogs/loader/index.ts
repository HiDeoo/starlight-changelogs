import { AstroError } from 'astro/errors'
import type { Loader } from 'astro/loaders'
import { setLoaderConfig } from 'virtual:starlight-changelogs/config'

import { saveLoaderConfig } from '../loader/config'

import { StarlightChangelogsLoaderConfigSchema, type StarlightChangelogsLoaderUserConfig } from './config'

export function changelogsLoader(userConfig: StarlightChangelogsLoaderUserConfig): Loader {
  const parsedConfig = StarlightChangelogsLoaderConfigSchema.safeParse(userConfig)

  return {
    name: 'starlight-changelogs-loader',
    load: async ({ config: astroConfig }) => {
      if (!parsedConfig.success) {
        throw new AstroError(
          `The provided starlight-changelogs loader configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
          `See the error report above for more informations.\n\nIf you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-changelogs/issues/new/choose`,
        )
      }

      const config = parsedConfig.data

      setLoaderConfig(config)
      await saveLoaderConfig(astroConfig, config)

      // return glob({
      //   base: `${context.config.srcDir.pathname.replace(context.config.root.pathname, '')}content/versions`,
      //   pattern: `**/[^_]*.{${extensions.join(',')}}`,
      // }).load(context)
    },
    // TODO(HiDeoo)
    // schema: docsVersionsSchema(),
  }
}
