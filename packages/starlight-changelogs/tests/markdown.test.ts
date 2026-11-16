import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { AstroConfig } from 'astro'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { loadMarkdownData, type MarkdownProviderConfig } from '../providers/markdown'

import { mockLoaderContext, mockStore } from './utils'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})
afterAll(() => server.close())

const baseConfig: Omit<MarkdownProviderConfig, 'changelog'> = {
  provider: { name: 'test', label: 'Test' },
  base: 'test',
  enabled: true,
  pagefind: false,
  pageSize: 5,
  title: 'Test',
  markdown: { isVersionHeading: ({ depth }) => depth === 2 },
}

describe('fs', () => {
  const store = mockStore()

  async function loadChangelog(content: string, markdown?: Partial<AstroConfig['markdown']>) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'starlight-changelogs-'))
    const changelog = path.join(dir, 'CHANGELOG.md')

    await fs.writeFile(changelog, content)

    try {
      await loadMarkdownData(
        {
          ...baseConfig,
          changelog: pathToFileURL(changelog).href,
        },
        mockLoaderContext(store, markdown),
      )
    } finally {
      await fs.rm(dir, { force: true, recursive: true })
    }
  }

  test('updates existing versions when a newer version is inserted', async () => {
    store.clear()

    await loadChangelog(`# Changelog

   ## 1.0.0-pre.1

   ### Changed

   - Pre-1 change

   ## 1.0.0-pre.0

   ### Added

   - Pre-0 addition
   `)

    await loadChangelog(`# Changelog

   ## 1.0.0-pre.2

   ### Changed

   - Pre-2 change

   ## 1.0.0-pre.1

   ### Changed

   - Pre-1 change

   ## 1.0.0-pre.0

   ### Added

   - Pre-0 addition
   `)

    const versions = store.values().toSorted((a, b) => a.data.index - b.data.index)

    expect(versions[0]?.data.title).toBe('1.0.0-pre.2')
  })

  test('preserves original Markdown', async () => {
    store.clear()

    await loadChangelog('## 1.0.0\n\n- [x] Done\n- ~~Removed~~ feature\n')

    expect(store.values()[0]?.body).toMatchInlineSnapshot(`
      "- [x] Done
      - ~~Removed~~ feature"
    `)
  })

  test('appends referenced definitions located somewhere else in the changelog', async () => {
    store.clear()

    await loadChangelog(
      '## 1.0.1\n\n- Fix [#4] and add a note[^1]\n\n## 1.0.0\n\n- Fix [#3]\n\n[#3]: https://example.com/3\n[#4]: https://example.com/4\n[unused]: https://example.com/unused\n[^1]: Note referencing [#3] and [#4].\n',
    )

    const versions = store.values().toSorted((a, b) => a.data.index - b.data.index)

    expect(versions[0]?.body).toMatchInlineSnapshot(`
      "- Fix [#4] and add a note[^1]

      [#4]: https://example.com/4

      [^1]: Note referencing [#3] and [#4].

      [#3]: https://example.com/3"
    `)

    expect(versions[1]?.body).toMatchInlineSnapshot(`
      "- Fix [#3]

      [#3]: https://example.com/3
      [#4]: https://example.com/4
      [unused]: https://example.com/unused
      [^1]: Note referencing [#3] and [#4]."
    `)
  })

  test('respects the GFM configuration', async () => {
    const content = '## 1.0.1\n\n- Note[^1]\n\n## 1.0.0\n\n- Fix\n\n[^1]: Footnote content.\n'

    store.clear()

    await loadChangelog(content, { gfm: true })

    expect(store.values()[0]?.body).toMatchInlineSnapshot(`
      "- Note[^1]

      [^1]: Footnote content."
    `)

    store.clear()

    await loadChangelog(content, { gfm: false })

    expect(store.values()[0]?.body).toMatchInlineSnapshot(`"- Note[^1]"`)
  })
})

describe('url', () => {
  test('does not throw on fetch failure in development', async () => {
    vi.stubEnv('DEV', true)

    const url = 'https://example.com/CHANGELOG.md'
    const config = {
      ...baseConfig,
      changelog: url,
    }

    const store = mockStore()
    const context = mockLoaderContext(store)

    let unavailable = true

    server.use(
      http.get(url, () =>
        unavailable ? new HttpResponse(null, { status: 503 }) : HttpResponse.text('## 1.0.0\n\n- Adds feature.'),
      ),
    )

    await loadMarkdownData(config, context)

    expect(store.values()).toEqual([])

    unavailable = false
    await loadMarkdownData(config, context)

    const entries = store.values()

    unavailable = true
    await loadMarkdownData(config, context)

    expect(store.values()).toEqual(entries)
  })

  test('uses a separate cache for each changelog with the same URL', async () => {
    const url = 'https://example.com/CHANGELOG.md'

    const store = mockStore()
    const context = mockLoaderContext(store)

    let cacheHitCount = 0

    server.use(
      http.get(url, ({ request }) => {
        if (request.headers.get('If-None-Match') === '"etag"') {
          cacheHitCount++
          return new HttpResponse(null, { status: 304 })
        }

        return HttpResponse.text('## 1.0.0\n\n- Adds feature.', { headers: { ETag: '"etag"' } })
      }),
    )

    await loadMarkdownData({ ...baseConfig, base: 'test-1', changelog: url }, context)
    await loadMarkdownData({ ...baseConfig, base: 'test-2', changelog: url }, context)
    await loadMarkdownData({ ...baseConfig, base: 'test-1', changelog: url }, context)

    const entries = store.values()

    expect(cacheHitCount).toBe(1)

    expect(entries.filter(({ data }) => data.base === 'test-1')).toHaveLength(1)
    expect(entries.filter(({ data }) => data.base === 'test-2')).toHaveLength(1)
  })
})
