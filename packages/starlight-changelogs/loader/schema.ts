import { z } from 'astro/zod'

export const VersionEntrySchema = z.object({
  /** The base path used for the changelog this version belongs to. */
  base: z.string(),
  /** An optional date for the version entry, if available. */
  date: z.date().optional(),
  /** An optional link to the version source for remote providers, e.g. GitHub. */
  link: z.string().url().optional(),
  /** The provider used for the associated changelog. */
  provider: z.object({
    /** The name of the provider. */
    name: z.string(),
    /** A human-readable label for the provider. */
    label: z.string(),
  }),
  /**
   * The slugified form of the version `title`.
   * This is different from the entry `id` which is the full path to the version entry.
   */
  slug: z.string(),
  /** The title of the version entry which is the version number. */
  title: z.string(),
})

export type VersionEntry = z.output<typeof VersionEntrySchema>

export interface VersionDataEntry extends VersionEntry {
  id: string
  body: string
}
