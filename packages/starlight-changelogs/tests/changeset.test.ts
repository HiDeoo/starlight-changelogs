import fs from 'node:fs/promises'

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll, describe, expect, test } from 'vitest'

import { loadChangesetData } from '../providers/changeset'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()
const server = setupServer()

describe('fs', () => {
  describe('changelog-github', () => {
    beforeAll(async () => {
      store.clear()

      await loadChangesetData(
        {
          provider: 'changeset',
          base: 'test',
          changelog: '../../../fixtures/changeset/changelog-github-starlight.md',
          pagefind: false,
          pageSize: 5,
          title: 'Test',
        },
        mockLoaderContext(store),
      )
    })

    test('loads all versions', () => {
      expect(store.values().length).toBe(154)
    })

    test('loads versions in reverse chronological order', () => {
      const versions = store.values()

      expect(versions[0]?.id).toBe('test/version/0-35-2')
      expect(versions[0]?.data.title).toBe('0.35.2')

      expect(versions[1]?.id).toBe('test/version/0-35-1')
      expect(versions[1]?.data.title).toBe('0.35.1')

      expect(versions[2]?.id).toBe('test/version/0-35-0')
      expect(versions[2]?.data.title).toBe('0.35.0')
    })

    test('loads the first version', () => {
      const version = store.values().at(-1)

      expect(version?.id).toBe('test/version/0-0-1')
      expect(version?.data.title).toBe('0.0.1')
    })

    test('includes the provider for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.provider.name).toBe('changeset')
      expect(version?.data.provider.label).toBe('Changeset')
    })

    test('includes the base for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.base).toBe('test')
    })

    test('includes the slug for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.slug).toBe('0-35-2')
    })

    test('loads markdown', () => {
      const version = store.values()[0]

      expect(version?.body).toMatchInlineSnapshot(`
      "### Patch Changes

      * [#3341](https://github.com/withastro/starlight/pull/3341) [\`10f6fe2\`](https://github.com/withastro/starlight/commit/10f6fe22a981247293ee4de106736f1a6ae24b6a) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Prevents potential build issues with the Astro Cloudflare adapter due to the dependency on Node.js builtins.

      * [#3327](https://github.com/withastro/starlight/pull/3327) [\`bf58c60\`](https://github.com/withastro/starlight/commit/bf58c60b9c3d5f5efdafbdba83cefa0566a367dc) Thanks [@delucis](https://github.com/delucis)! - Fixes a routing bug for docs pages with a slug authored with non-normalized composition. This could occur for filenames containing diacritics in some circumstances, causing 404s.
      "
    `)
    })
  })

  describe('changelog-git', () => {
    beforeAll(async () => {
      store.clear()

      await loadChangesetData(
        {
          provider: 'changeset',
          base: 'test',
          changelog: '../../../fixtures/changeset/changelog-git-react-three-test-renderer.md',
          pagefind: false,
          pageSize: 5,
          title: 'Test',
        },
        mockLoaderContext(store),
      )
    })

    test('loads all versions', () => {
      expect(store.values().length).toBe(62)
    })

    test('loads versions in reverse chronological order', () => {
      const versions = store.values()

      expect(versions[0]?.id).toBe('test/version/9-1-0')
      expect(versions[0]?.data.title).toBe('9.1.0')

      expect(versions[1]?.id).toBe('test/version/9-0-1')
      expect(versions[1]?.data.title).toBe('9.0.1')

      expect(versions[2]?.id).toBe('test/version/9-0-0')
      expect(versions[2]?.data.title).toBe('9.0.0')
    })

    test('loads the first version', () => {
      const version = store.values().at(-1)

      expect(version?.id).toBe('test/version/6-1-1')
      expect(version?.data.title).toBe('6.1.1')
    })

    test('includes the provider for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.provider.name).toBe('changeset')
      expect(version?.data.provider.label).toBe('Changeset')
    })

    test('includes the base for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.base).toBe('test')
    })

    test('includes the slug for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.slug).toBe('9-1-0')
    })

    test('loads markdown', () => {
      const version = store.values()[0]

      expect(version?.body).toMatchInlineSnapshot(`
      "### Minor Changes

      * 31781e5a1fdc464cb67617cc3d7bc5d8690cd4cd: feat(RTTR): handle primitives in test-renderer and fix queries in TestInstances
      "
    `)
    })
  })
})

describe('url', async () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const url =
    'https://raw.githubusercontent.com/HiDeoo/starlight-blog/refs/heads/main/packages/starlight-blog/CHANGELOG.md'

  const config = {
    provider: 'changeset',
    base: 'test',
    changelog: url,
    pagefind: false,
    pageSize: 5,
    title: 'Test',
  } as const

  const fixture = await fs.readFile(
    new URL('../../../fixtures/changeset/changelog-github-starlight-blog.txt', import.meta.url),
    'utf8',
  )

  describe('no cache', () => {
    beforeAll(async () => {
      store.clear()

      server.use(http.get(url, () => HttpResponse.text(fixture)))

      await loadChangesetData(config, mockLoaderContext(store))
    })

    test('loads all versions', () => {
      expect(store.values().length).toBe(15)
    })

    test('loads versions in reverse chronological order', () => {
      const versions = store.values()

      expect(versions[0]?.id).toBe('test/version/0-24-0')
      expect(versions[0]?.data.title).toBe('0.24.0')

      expect(versions[1]?.id).toBe('test/version/0-23-2')
      expect(versions[1]?.data.title).toBe('0.23.2')

      expect(versions[2]?.id).toBe('test/version/0-23-1')
      expect(versions[2]?.data.title).toBe('0.23.1')
    })

    test('loads the first version', () => {
      const version = store.values().at(-1)

      expect(version?.id).toBe('test/version/0-16-0')
      expect(version?.data.title).toBe('0.16.0')
    })

    test('includes the provider for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.provider.name).toBe('changeset')
      expect(version?.data.provider.label).toBe('Changeset')
    })

    test('includes the base for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.base).toBe('test')
    })

    test('includes the slug for each entries', () => {
      const version = store.values()[0]

      expect(version?.data.slug).toBe('0-24-0')
    })

    test('loads markdown', () => {
      const version = store.values()[0]

      expect(version?.body).toMatchInlineSnapshot(`
      "### Minor Changes

      * [#162](https://github.com/HiDeoo/starlight-blog/pull/162) [\`bc995dc\`](https://github.com/HiDeoo/starlight-blog/commit/bc995dce6ad26075316ee3240c6933bd00ffb090) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Exposes a list of all the authors in the blog data object accessible on Starlight pages using \`Astro.locals.starlightBlog.authors\`. This can be useful for example to create a widget that lists all the authors of your blog on your homepage.

        See the [“Blog Data” guide](https://starlight-blog-docs.vercel.app/guides/blog-data/) for more information.

      * [#160](https://github.com/HiDeoo/starlight-blog/pull/160) [\`f91a48c\`](https://github.com/HiDeoo/starlight-blog/commit/f91a48c9d5527dcc54f0374e511fedd9bab95515) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for [remote](https://docs.astro.build/en/guides/images/#remote-images) [cover images](https://starlight-blog-docs.vercel.app/guides/frontmatter/#cover) in blog posts.

      * [#155](https://github.com/HiDeoo/starlight-blog/pull/155) [\`e5746c1\`](https://github.com/HiDeoo/starlight-blog/commit/e5746c19e8d350e0fc7e759de221fa6948100875) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for [metrics](https://starlight-blog-docs.vercel.app/configuration/#metrics-configuration) that can be displayed alongside blog posts, such as an estimated reading time or a word count.

        To learn more about metrics, check the new ["Metrics" guide](https://starlight-blog-docs.vercel.app/guides/metrics/).
      "
    `)
    })
  })

  describe('cache', () => {
    let requestCount = 0

    beforeAll(() => {
      store.clear()

      server.use(
        http.get(url, () => {
          requestCount++

          return requestCount === 1
            ? HttpResponse.text(fixture, {
                headers: {
                  etag: 'test-etag',
                  'last-modified': 'Sun, 03 Jul 2025 12:30:00 GMT',
                },
              })
            : new HttpResponse('', { status: 304 })
        }),
      )
    })

    test('uses cache', async () => {
      await loadChangesetData(config, mockLoaderContext(store))

      expect(requestCount).toBe(1)
      expect(store.values().length).toBe(15)

      await loadChangesetData(config, mockLoaderContext(store))

      expect(requestCount).toBe(2)
      expect(store.values().length).toBe(15)
    })
  })
})
