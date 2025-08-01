import type { StarlightPlugin } from '@astrojs/starlight/types'

import { vitePluginStarlightChangelogs } from './libs/vite'

export default function starlightChangelogs(): StarlightPlugin {
  return {
    name: 'starlight-changelogs',
    hooks: {
      'config:setup': ({ addIntegration, config: starlightConfig }) => {
        addIntegration({
          name: 'starlight-changelogs-integration',
          hooks: {
            'astro:config:setup': ({ command, config: astroConfig, injectRoute, updateConfig }) => {
              if (command !== 'dev' && command !== 'build') return

              injectRoute({
                entrypoint: 'starlight-changelogs/routes/index.astro',
                pattern: '[...slug]',
                prerender: true,
              })

              updateConfig({
                vite: { plugins: [vitePluginStarlightChangelogs(astroConfig, starlightConfig, command)] },
              })
            },
          },
        })
      },
    },
  }
}
