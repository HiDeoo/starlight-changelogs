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

type LoaderResult = { ok: true; response: Response } | { ok: false }
