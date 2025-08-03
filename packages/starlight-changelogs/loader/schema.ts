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
  // TODO(HiDeoo) comment
  provider: z.object({
    // TODO(HiDeoo) comment
    name: z.string(),
    // TODO(HiDeoo) comment
    label: z.string(),
  }),
  // TODO(HiDeoo) comment
  link: z.string().url().optional(),
  // TODO(HiDeoo) comment
  date: z.date().optional(),
})

export type VersionEntry = z.output<typeof VersionEntrySchema>

export interface VersionDataEntry extends VersionEntry {
  id: string
  body: string
}
