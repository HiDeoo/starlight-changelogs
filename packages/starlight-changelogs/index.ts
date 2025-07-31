import type { StarlightPlugin } from '@astrojs/starlight/types'

export default function starlightChangelogs(): StarlightPlugin {
  return {
    name: 'starlight-auto-drafts',
    hooks: {
      'config:setup': ({ logger }) => {
        logger.info('🚨 Hello from plugin')
      },
    },
  }
}
