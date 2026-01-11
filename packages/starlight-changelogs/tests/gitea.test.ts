import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { beforeAll, afterEach, afterAll, describe, expect, test } from 'vitest'

import { loadGiteaData } from '../providers/gitea'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()
const server = setupServer()

const baseConfig = {
  provider: 'gitea',
  providerLabel: 'Gitea',
  api: 'https://gitea.com/api/v1',
  base: 'test',
  owner: 'gitea',
  repo: 'tea',
  enabled: true,
  pagefind: false,
  pageSize: 5,
  title: 'Test',
} as const

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('api', () => {
  beforeAll(async () => {
    store.clear()

    const fixture = await import('../../../fixtures/gitea/tea.json')

    server.use(
      http.get('https://gitea.com/api/v1/repos/gitea/tea/releases', ({ request }) => {
        const url = new URL(request.url)

        expect(url.searchParams.get('page')).toBe('1')

        return HttpResponse.json(fixture.default)
      }),
    )

    await loadGiteaData(baseConfig, mockLoaderContext(store))
  })

  test('loads all versions', () => {
    expect(store.values().length).toBe(19)
  })

  test('loads versions in reverse chronological order', () => {
    const versions = store.values()

    expect(versions[0]?.id).toBe('test/version/v0-11-1')
    expect(versions[0]?.data.title).toBe('v0.11.1')

    expect(versions[1]?.id).toBe('test/version/v0-11-0')
    expect(versions[1]?.data.title).toBe('v0.11.0')

    expect(versions[2]?.id).toBe('test/version/v0-10-1')
    expect(versions[2]?.data.title).toBe('v0.10.1')
  })

  test('loads the first version', () => {
    const version = store.values().at(-1)

    expect(version?.id).toBe('test/version/v0-1-0')
    expect(version?.data.title).toBe('v0.1.0')
  })

  test('includes the provider for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.provider.name).toBe('gitea')
    expect(version?.data.provider.label).toBe('Gitea')
  })

  test('includes the base for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.base).toBe('test')
  })

  test('includes the slug for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.slug).toBe('v0-11-1')
  })

  test('includes the link for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.link).toBe('https://gitea.com/gitea/tea/releases/tag/v0.11.1')
  })

  test('loads markdown', () => {
    const version = store.values()[0]

    expect(version?.body).toMatchInlineSnapshot(`
      "## Changelog   
      * 61d4e57 Fix Pr Create crash (#823)   
      * 4f33146 add test for matching logins (#820)   
      * 08b8398 Update README.md (#819)

      "
    `)
  })
})

describe('api - auth', () => {
  beforeAll(async () => {
    store.clear()

    const token = 'test_token'
    const fixture = await import('../../../fixtures/gitea/tea.json')

    server.use(
      http.get('https://gitea.com/api/v1/repos/gitea/tea/releases', ({ request }) => {
        const url = new URL(request.url)

        expect(url.searchParams.get('page')).toBe('1')
        expect(request.headers.get('Authorization')).toBe(`token ${token}`)

        return HttpResponse.json(fixture.default)
      }),
    )

    await loadGiteaData({ ...baseConfig, token }, mockLoaderContext(store))
  })

  test('loads all versions with auth', () => {
    expect(store.values().length).toBe(19)
  })
})
