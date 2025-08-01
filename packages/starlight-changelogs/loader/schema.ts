import { z } from 'astro/zod'

export const StarlightChangelogsEntrySchema = z.object({
  // TODO(HiDeoo) comment
  prefix: z.string(),
  // TODO(HiDeoo) comment
  id: z.string(),
  // TODO(HiDeoo) comment
  slug: z.string(),
  // TODO(HiDeoo) comment
  title: z.string(),
})

export type StarlightChangelogsEntry = z.output<typeof StarlightChangelogsEntrySchema>
