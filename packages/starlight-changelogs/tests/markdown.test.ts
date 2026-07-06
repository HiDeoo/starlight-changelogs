import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { describe, expect, test } from 'vitest'

import { loadMarkdownData } from '../providers/markdown'

import { mockLoaderContext, mockStore } from './utils'

describe('fs', () => {
  const store = mockStore()

  async function loadChangelog(content: string) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'starlight-changelogs-'))
    const changelog = path.join(dir, 'CHANGELOG.md')

    await fs.writeFile(changelog, content)

    try {
      await loadMarkdownData(
        {
          provider: { name: 'test', label: 'Test' },
          base: 'test',
          changelog: pathToFileURL(changelog).href,
          enabled: true,
          pagefind: false,
          pageSize: 5,
          title: 'Test',
          markdown: { versionHeadingLevel: 2 },
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
