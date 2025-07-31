import { AstroError } from 'astro/errors'

export function throwLoaderError(message: string, error?: unknown): never {
  throw new AstroError(
    `${message}${error instanceof Error ? `\n\n  ${error.message}\n` : ''}`,
    `See the error report above for more informations.\n\nIf you believe this is a bug, please file an issue at https://github.com/HiDeoo/starlight-changelogs/issues/new/choose`,
  )
}
