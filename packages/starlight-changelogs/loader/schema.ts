import { z } from 'astro/zod'

export const StarlightChangelogsEntrySchema = z.object({
  // TODO(HiDeoo) comment
  id: z.string(),
  // TODO(HiDeoo) comment
  title: z.string(),
})

export type StarlightChangelogsEntry = z.output<typeof StarlightChangelogsEntrySchema>
