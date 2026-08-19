import type { LoaderContext } from 'astro/loaders'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { fetchFromLoader } from '../libs/net'

const url = new URL('https://example.com/changelog.md')
const warn = vi.fn()
const logger = { warn } as unknown as LoaderContext['logger']

afterEach(() => {
  warn.mockClear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('development', () => {
  beforeEach(() => vi.stubEnv('DEV', true))

  test('returns a failed result for an HTTP failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 503, statusText: 'Service Unavailable' }))),
    )

    await expect(fetchFromLoader(url, new Headers(), logger)).resolves.toEqual({ ok: false })

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toMatchInlineSnapshot(`
      "Failed to fetch data from https://example.com/changelog.md with the following error:
        503 - Service Unavailable
        Using cached data if available, so changelog data may be missing or outdated.
        Production builds will fail until the changelog data is available again."
    `)
  })

  test('returns a failed result for a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network unavailable'))),
    )

    await expect(fetchFromLoader(url, new Headers(), logger)).resolves.toEqual({ ok: false })

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toMatchInlineSnapshot(`
      "Failed to fetch data from https://example.com/changelog.md with the following error:
        Network unavailable
        Using cached data if available, so changelog data may be missing or outdated.
        Production builds will fail until the changelog data is available again."
    `)
  })

  test('returns a 304 response', async () => {
    const response = new Response(null, { status: 304 })

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response)),
    )

    await expect(fetchFromLoader(url, new Headers(), logger)).resolves.toEqual({ ok: true, response })

    expect(warn).not.toHaveBeenCalled()
  })
})

describe('production', () => {
  beforeEach(() => vi.stubEnv('DEV', false))

  test('returns an HTTP failure', async () => {
    const response = new Response(null, { status: 503, statusText: 'Service Unavailable' })

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(response)),
    )

    await expect(fetchFromLoader(url, new Headers(), logger)).resolves.toEqual({ ok: true, response })

    expect(warn).not.toHaveBeenCalled()
  })

  test('throws a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network unavailable'))),
    )

    await expect(fetchFromLoader(url, new Headers(), logger)).rejects.toThrow('Network unavailable')

    expect(warn).not.toHaveBeenCalled()
  })
})
