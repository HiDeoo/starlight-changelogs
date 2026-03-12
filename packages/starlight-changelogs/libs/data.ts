import type { z } from 'astro/zod'
import { getCollection, type CollectionEntry, type ContentConfig } from 'astro:content'

export async function getChangelogs(filter?: (entry: ChangelogsCollectionEntry) => unknown) {
  // TODO: this casting is a workaround for Astro v6 regression where the collection entry type is not properly inferred
  // for custom loaders. Remove the casting once the issue is resolved in Astro.
  // https://github.com/HiDeoo/astro-6-cc-loader-schema-types-repro
  const entries = (await getCollection('changelogs', filter)) as ChangelogsCollectionEntry[]
  return entries.toSorted((a, b) => a.data.index - b.data.index)
}

// TODO: this casting is a workaround for Astro v6 regression where the collection entry type is not properly inferred
// for custom loaders. Replace it by `CollectionEntry<'changelogs'>` once the issue is resolved in Astro.
// https://github.com/HiDeoo/astro-6-cc-loader-schema-types-repro
export type ChangelogsCollectionEntry = Omit<CollectionEntry<'changelogs'>, 'data'> & {
  data: z.infer<
    Extract<Required<ContentConfig['collections']['changelogs']>, { type?: 'content_layer' }>['loader']['schema']
  >
}
