import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll, describe, expect, test } from 'vitest'

import { loadGitHubData } from '../../providers/github'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()
const server = setupServer()

const baseConfig = {
  provider: 'github',
  owner: 'hideoo',
  repo: 'starlight-blog',
  pageSize: 5,
  base: 'test',
  title: 'Test',
} as const

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('api', () => {
  beforeAll(async () => {
    store.clear()

    const fixture = await import('../../../../fixtures/github/starlight-blog.json')

    server.use(
      http.get('https://api.github.com/repos/hideoo/starlight-blog/releases', ({ request }) => {
        const url = new URL(request.url)

        expect(url.searchParams.get('page')).toBe('1')

        return HttpResponse.json(fixture.default)
      }),
    )

    await loadGitHubData(baseConfig, mockLoaderContext(store))
  })

  test('loads all versions', () => {
    expect(store.values().length).toBe(30)
  })

  test('loads versions in reverse chronological order', () => {
    const versions = store.values()

    expect(versions[0]?.id).toBe('test/version/starlight-blog-0-24-0')
    expect(versions[0]?.data.title).toBe('starlight-blog@0.24.0')

    expect(versions[1]?.id).toBe('test/version/starlight-blog-0-23-2')
    expect(versions[1]?.data.title).toBe('starlight-blog@0.23.2')

    expect(versions[2]?.id).toBe('test/version/starlight-blog-0-23-1')
    expect(versions[2]?.data.title).toBe('starlight-blog@0.23.1')
  })

  test('loads the first version', () => {
    const version = store.values().at(-1)

    expect(version?.id).toBe('test/version/v0-7-1')
    expect(version?.data.title).toBe('v0.7.1')
  })

  test('includes the provider for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.provider.name).toBe('github')
    expect(version?.data.provider.label).toBe('GitHub')
  })

  test('includes the base for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.base).toBe('test')
  })

  test('includes the slug for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.slug).toBe('starlight-blog-0-24-0')
  })

  test('includes the link for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.link).toBe('https://github.com/HiDeoo/starlight-blog/releases/tag/starlight-blog%400.24.0')
  })

  test('loads markdown', () => {
    const version = store.values()[0]

    expect(version?.body).toMatchInlineSnapshot(`
      "### Minor Changes

      -   [#162](https://github.com/HiDeoo/starlight-blog/pull/162) [\`bc995dc\`](https://github.com/HiDeoo/starlight-blog/commit/bc995dce6ad26075316ee3240c6933bd00ffb090) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Exposes a list of all the authors in the blog data object accessible on Starlight pages using \`Astro.locals.starlightBlog.authors\`. This can be useful for example to create a widget that lists all the authors of your blog on your homepage.

          See the [“Blog Data” guide](https://starlight-blog-docs.vercel.app/guides/blog-data/) for more information.

      -   [#160](https://github.com/HiDeoo/starlight-blog/pull/160) [\`f91a48c\`](https://github.com/HiDeoo/starlight-blog/commit/f91a48c9d5527dcc54f0374e511fedd9bab95515) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for [remote](https://docs.astro.build/en/guides/images/#remote-images) [cover images](https://starlight-blog-docs.vercel.app/guides/frontmatter/#cover) in blog posts.

      -   [#155](https://github.com/HiDeoo/starlight-blog/pull/155) [\`e5746c1\`](https://github.com/HiDeoo/starlight-blog/commit/e5746c19e8d350e0fc7e759de221fa6948100875) Thanks [@HiDeoo](https://github.com/HiDeoo)! - Adds support for [metrics](https://starlight-blog-docs.vercel.app/configuration/#metrics-configuration) that can be displayed alongside blog posts, such as an estimated reading time or a word count.

          To learn more about metrics, check the new ["Metrics" guide](https://starlight-blog-docs.vercel.app/guides/metrics/).
      "
    `)
  })
})

describe('cache', () => {
  let requestCount = 0

  beforeAll(async () => {
    store.clear()

    const fixture = await import('../../../../fixtures/github/starlight-blog.json')

    server.use(
      http.get('https://api.github.com/repos/hideoo/starlight-blog/releases', () => {
        requestCount++

        return requestCount === 1
          ? HttpResponse.json(fixture.default, {
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
    await loadGitHubData(baseConfig, mockLoaderContext(store))

    expect(requestCount).toBe(1)
    expect(store.values().length).toBe(30)

    await loadGitHubData(baseConfig, mockLoaderContext(store))

    expect(requestCount).toBe(2)
    expect(store.values().length).toBe(30)
  })
})
