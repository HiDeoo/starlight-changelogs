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
        path: '../fixtures/changeset/changelog-github-starlight.md',
        // process: ({ name }) => {
        //   if (!name.endsWith('.0')) return
        //   return name + ' processed'
        // },
      },
      // {
      //   provider: 'github',
      //   base: 'test',
      //   owner: 'hideoo',
      //   repo: 'starlight-blog',
      //   process: ({ title }) => {
      //     // if (!title.endsWith('.0')) return
      //     return title.replace('starlight-blog@', '')
      //   },
      // },
    ]),
  }),
}
