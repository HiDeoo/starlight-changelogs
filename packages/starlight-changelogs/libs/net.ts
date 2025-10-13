import type { LoaderContext } from 'astro/loaders'

export async function fetchFromLoader(
  url: URL,
  headers: HeadersInit,
  logger: LoaderContext['logger'],
): Promise<LoaderResult> {
  let response: Response | undefined

  try {
    response = await fetch(url, { headers })
  } catch (error) {
    if (!import.meta.env.DEV) throw error

    logger.error(`Failed to fetch data from ${url} with the following error:`)
    logger.error(error instanceof Error ? error.message : String(error))
    logger.error('Continuing without changelog data for now, but make sure the URL is correct and accessible.')
  }

  return response ? { ok: true, response } : { ok: false }
}

type LoaderResult = { ok: true; response: Response } | { ok: false }
