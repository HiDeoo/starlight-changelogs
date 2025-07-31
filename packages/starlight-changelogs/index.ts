import type { StarlightPlugin } from '@astrojs/starlight/types'

import { vitePluginStarlightChangelogs } from './libs/vite'

export default function starlightChangelogs(): StarlightPlugin {
  return {
    name: 'starlight-changelogs',
    hooks: {
      'config:setup': ({ addIntegration }) => {
        addIntegration({
          name: 'starlight-changelogs-integration',
          hooks: {
            'astro:config:setup': ({ command, config, updateConfig }) => {
              if (command !== 'dev' && command !== 'build') return

              updateConfig({ vite: { plugins: [vitePluginStarlightChangelogs(config, command)] } })
            },
          },
        })
      },
    },
  }
}
