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
        base: 'test',
        pagefind: false,
        path: '../fixtures/changeset/changelog-github-starlight.md',
        process: ({ title }) => {
          if (!title.endsWith('.0')) return
          return title + ' processed'
        },
      },
      // {
      //   provider: 'github',
      //   base: 'test',
      //   owner: 'hideoo',
      //   repo: 'starlight-blog',
      //   token: import.meta.env.GITHUB_API_TOKEN,
      //   process: ({ title }) => {
      //     // if (!title.endsWith('.0')) return
      //     return title.replace(/^(?:starlight-blog@|v)/, '')
      //   },
      // },
    ]),
  }),
}
