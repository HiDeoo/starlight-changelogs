import type { LoaderContext } from 'astro/loaders'

export async function fetchFromLoader(
  url: URL,
  headers: HeadersInit,
  logger: LoaderContext['logger'],
): Promise<LoaderResult> {
  let response: Response | undefined

  try {
    response = await fetch(url, { headers })

    if (import.meta.env.DEV && response.status >= 400) {
      throw new Error(response.statusText ? `${response.status} - ${response.statusText}` : String(response.status))
    }
  } catch (error) {
    if (!import.meta.env.DEV) throw error

    logger.warn(
      `Failed to fetch data from ${url} with the following error:
  ${error instanceof Error ? error.message : String(error)}
  Using cached data if available, so changelog data may be missing or outdated.
  Production builds will fail until the changelog data is available again.`,
    )

    return { ok: false }
  }

  return { ok: true, response }
}

export function getChangelogMeta(meta: LoaderContext['meta'], base: string): LoaderContext['meta'] {
  return {
    delete: (key) => meta.delete(scopeKey(base, key)),
    get: (key) => meta.get(scopeKey(base, key)),
    has: (key) => meta.has(scopeKey(base, key)),
    set: (key, value) => meta.set(scopeKey(base, key), value),
  }
}

function scopeKey(base: string, key: string) {
  // The meta store is shared by all changelogs so each changelog needs its own keys.
  return `${base}:${key}`
}

type LoaderResult = { ok: true; response: Response } | { ok: false }
