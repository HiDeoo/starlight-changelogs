import { beforeAll, describe, expect, test } from 'vitest'

import { loadKeepAChangelogData } from '../providers/keep-a-changelog'

import { mockLoaderContext, mockStore } from './utils'

const store = mockStore()

describe('fs', () => {
  beforeAll(async () => {
    store.clear()

    await loadKeepAChangelogData(
      {
        provider: 'keep-a-changelog',
        base: 'test',
        changelog: '../../../fixtures/keep-a-changelog/keep-a-changelog.md',
        enabled: true,
        pagefind: false,
        pageSize: 5,
        title: 'Test',
      },
      mockLoaderContext(store),
    )
  })

  test('loads all versions', () => {
    expect(store.values().length).toBe(14)
  })

  test('ignores unreleased version', () => {
    const versions = store.values()

    expect(versions.some((version) => version.data.title === 'Unreleased')).toBe(false)
  })

  test('loads versions in reverse chronological order', () => {
    const versions = store.values()

    expect(versions[0]?.id).toBe('test/version/1-1-1')
    expect(versions[0]?.data.title).toBe('1.1.1')

    expect(versions[1]?.id).toBe('test/version/1-1-0')
    expect(versions[1]?.data.title).toBe('1.1.0')

    expect(versions[2]?.id).toBe('test/version/1-0-0')
    expect(versions[2]?.data.title).toBe('1.0.0')

    expect(versions[3]?.id).toBe('test/version/0-3-0')
    expect(versions[3]?.data.title).toBe('0.3.0')
  })

  test('loads the first version', () => {
    const version = store.values().at(-1)

    expect(version?.id).toBe('test/version/0-0-1')
    expect(version?.data.title).toBe('0.0.1')
  })

  test('includes the provider for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.provider.name).toBe('keep-a-changelog')
    expect(version?.data.provider.label).toBe('Keep a Changelog')
  })

  test('includes the base for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.base).toBe('test')
  })

  test('includes the slug for each entries', () => {
    const version = store.values()[0]

    expect(version?.data.slug).toBe('1-1-1')
  })

  test('loads markdown', () => {
    const version = store.values()[0]

    expect(version?.body).toMatchInlineSnapshot(`
      "### Added

      * v1.1 Arabic translation (#444).
      * v1.1 French translation.
      * v1.1 Dutch translation (#371).
      * v1.1 Russian translation (#410).
      * v1.1 Japanese translation (#363).
      * v1.1 Norwegian Bokmål translation (#383).
      * v1.1 "Inconsistent Changes" Turkish translation (#347).
      * Default to most recent versions available for each languages.
      * Display count of available translations (26 to date!).
      * Centralize all links into \`/data/links.json\` so they can be updated easily.

      ### Fixed

      * Improve French translation (#377).
      * Improve id-ID translation (#416).
      * Improve Persian translation (#457).
      * Improve Russian translation (#408).
      * Improve Swedish title (#419).
      * Improve zh-CN translation (#359).
      * Improve French translation (#357).
      * Improve zh-TW translation (#360, #355).
      * Improve Spanish (es-ES) transltion (#362).
      * Foldout menu in Dutch translation (#371).
      * Missing periods at the end of each change (#451).
      * Fix missing logo in 1.1 pages.
      * Display notice when translation isn't for most recent version.
      * Various broken links, page versions, and indentations.

      ### Changed

      * Upgrade dependencies: Ruby 3.2.1, Middleman, etc.

      ### Removed

      * Unused normalize.css file.
      * Identical links assigned in each translation file.
      * Duplicate index file for the english version.
      "
    `)
  })
})
