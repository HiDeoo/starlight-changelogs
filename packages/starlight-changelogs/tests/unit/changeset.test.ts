import { beforeAll, describe, expect, test } from 'vitest'

import { loadChangesetData } from '../../providers/changeset'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()

describe('changelog-github', () => {
  beforeAll(async () => {
    store.clear()

    await loadChangesetData(
      {
        provider: 'changeset',
        path: '../../../../fixtures/changeset/changelog-github-starlight.md',
        pageSize: 5,
        base: 'test',
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
