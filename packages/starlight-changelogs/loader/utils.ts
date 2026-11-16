import type { LoaderContext } from 'astro/loaders'
import { slug } from 'github-slugger'

import type { ProviderBaseConfig } from '../providers'

export function slugifyVersion(config: ProviderBaseConfig, version: string): [id: string, slug: string] {
  const versionSlug = slug(version.replaceAll(/[.@]/g, ' '))

  return [`${config.base}/version/${versionSlug}`, versionSlug]
}

export async function renderVersion(
  renderMarkdown: LoaderContext['renderMarkdown'],
  body: string,
  versionSlug: string,
) {
  // Ensure horizontal rules at the beginning of the body are not mistaken for frontmatter by prepending an empty
  // frontmatter block.
  const rendered = await renderMarkdown(`---\n---\n${body}`)

  // Ensure footnote IDs are unique by prefixing them with the version slug.
  return {
    ...rendered,
    html: rendered.html.replaceAll(
      /(id="|href="#)user-content-fn/g,
      (_match, attribute: string) => `${attribute}user-content-${versionSlug}-fn`,
    ),
  }
}
