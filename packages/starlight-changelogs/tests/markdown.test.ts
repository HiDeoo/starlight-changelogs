import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { loadMarkdownData } from '../providers/markdown'

import { mockLoaderContext, mockStore } from './utils'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})
afterAll(() => server.close())

const baseConfig = {
  provider: { name: 'test', label: 'Test' },
  base: 'test',
  enabled: true,
  pagefind: false,
  pageSize: 5,
  title: 'Test',
  markdown: { versionHeadingLevel: 2 },
}

describe('fs', () => {
  const store = mockStore()

  async function loadChangelog(content: string) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'starlight-changelogs-'))
    const changelog = path.join(dir, 'CHANGELOG.md')

    await fs.writeFile(changelog, content)

    try {
      await loadMarkdownData(
        {
          ...baseConfig,
          changelog: pathToFileURL(changelog).href,
        },
        mockLoaderContext(store),
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
})
