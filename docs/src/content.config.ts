import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { defineCollection } from 'astro:content'
import { changelogsLoader } from 'starlight-changelogs/loader'

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      // {
      //   provider: 'changeset',
      //   base: 'test',
      //   path: '../fixtures/changeset/changelog-github-starlight.md',
      // },
      {
        provider: 'github',
        base: 'test',
        owner: 'hideoo',
        repo: 'starlight-blog',
      },
    ]),
  }),
}
