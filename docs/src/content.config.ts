import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'
import { changelogsLoader } from 'starlight-changelogs/loader'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: 'changeset',
        base: 'demo/starlight',
        changelog: '../fixtures/changeset/changelog-github-starlight.md',
        title: 'Starlight Changelog',
        pagefind: false,
      },
      {
        provider: 'github',
        base: 'demo/starlight-blog',
        owner: 'hideoo',
        repo: 'starlight-blog',
        title: 'Starlight Blog Changelog',
        token: import.meta.env.GH_API_TOKEN,
        pagefind: false,
        process: ({ title }) => {
          return title.replace(/^(?:starlight-blog@|v)/, '')
        },
      },
    ]),
  }),
}
