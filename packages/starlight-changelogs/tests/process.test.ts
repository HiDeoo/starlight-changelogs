import { beforeEach, expect, test } from 'vitest'

import { loadChangesetData } from '../providers/changeset'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()

const baseConfig = {
  provider: 'changeset',
  base: 'test',
  changelog: '../../../fixtures/changeset/changelog-github-starlight.md',
  enabled: true,
  pagefind: false,
  pageSize: 5,
  title: 'Test',
} as const

beforeEach(() => {
  store.clear()
})

test('processes titles', async () => {
  await loadChangesetData(
    {
      ...baseConfig,
      process: ({ title }) => {
        return `${title} (processed)`
      },
    },
    mockLoaderContext(store),
  )

  const versions = store.values()

  expect(
    versions.every((version) => {
      const title = version.data['title']
      return typeof title === 'string' && title.endsWith(' (processed)')
    }),
  ).toBe(true)
})

test('filters out versions', async () => {
  await loadChangesetData(
    {
      ...baseConfig,
      process: ({ title }) => {
        if (title.endsWith('.0')) return
        return title
      },
    },
    mockLoaderContext(store),
  )

  const versions = store.values()

  expect(
    versions.every((version) => {
      const title = version.data['title']
      return typeof title === 'string' && !title.endsWith('.0')
    }),
  ).toBe(true)
})
