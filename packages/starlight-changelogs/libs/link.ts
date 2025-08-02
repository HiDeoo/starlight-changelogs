import type { AstroConfig } from 'astro'
import context from 'virtual:starlight-changelogs/context'

import { ensureTrailingSlash, stripLeadingSlash, stripTrailingSlash } from './path'

const trailingSlashTransformers: Record<AstroConfig['trailingSlash'], (path: string) => string> = {
  always: ensureTrailingSlash,
  ignore: ensureTrailingSlash,
  never: stripTrailingSlash,
}

const trailingSlashTransformer = trailingSlashTransformers[context.trailingSlash]

const base = stripTrailingSlash(import.meta.env.BASE_URL)

export function getLink(path: string) {
  path = stripLeadingSlash(path)
  path = path ? `${base}/${path}` : `${base}/`

  return trailingSlashTransformer(path)
}

export interface PaginationLink {
  label: string
  link: string
}

export interface PaginationLinks {
  next: PaginationLink | undefined
  prev: PaginationLink | undefined
}
