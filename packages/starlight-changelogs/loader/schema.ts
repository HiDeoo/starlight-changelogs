import { z } from 'astro/zod'

export const VersionEntrySchema = z.object({
  // TODO(HiDeoo) comment
  base: z.string(),
  // // TODO(HiDeoo) comment
  // id: z.string(),
  // TODO(HiDeoo) comment
  slug: z.string(),
  // TODO(HiDeoo) comment
  title: z.string(),
})

export type VersionEntry = z.output<typeof VersionEntrySchema>
