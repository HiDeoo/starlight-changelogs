import { slug } from 'github-slugger'

import type { ProviderBaseConfig } from '../providers'

export function slugifyVersion(config: ProviderBaseConfig, version: string): [id: string, slug: string] {
  const versionSlug = slug(version.replaceAll(/[.@]/g, ' '))

  return [`${config.base}/version/${versionSlug}`, versionSlug]
}
