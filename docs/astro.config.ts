import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'
import starlightChangelogs, { makeChangelogsSidebarLinks } from 'starlight-changelogs'

export default defineConfig({
  integrations: [
    starlight({
      description: 'Starlight plugin to display changelogs alongside your project documentation.',
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/starlight-changelogs/edit/main/docs/',
      },
      plugins: [starlightChangelogs()],
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started'],
        },
        {
          label: 'Providers',
          items: ['providers/changesets', 'providers/github'],
        },
        {
          label: 'Guides',
          items: ['guides/changelog-links', 'guides/i18n'],
        },
        {
          label: 'Resources',
          items: [{ label: 'Plugins and Tools', slug: 'resources/starlight' }],
        },
        {
          label: 'Demo',
          items: [
            'demo/overview',
            {
              label: 'Starlight',
              items: [
                ...makeChangelogsSidebarLinks([
                  {
                    base: 'demo/starlight',
                    label: {
                      en: 'Version History',
                      fr: 'Historique des versions',
                    },
                    type: 'all',
                  },
                  { base: 'demo/starlight', label: 'Latest version', type: 'latest' },
                ]),
              ],
            },
            {
              label: 'Starlight Blog',
              items: [...makeChangelogsSidebarLinks([{ base: 'demo/starlight-blog', type: 'recent' }])],
            },
          ],
        },
      ],
      social: [
        {
          href: 'https://bsky.app/profile/hideoo.dev',
          icon: 'blueSky',
          label: 'Bluesky',
        },
        {
          href: 'https://github.com/HiDeoo/starlight-changelogs',
          icon: 'github',
          label: 'GitHub',
        },
      ],
      title: 'Starlight Changelogs',
    }),
  ],
  site: 'https://starlight-changelogs.netlify.app/',
  trailingSlash: 'always',
})
