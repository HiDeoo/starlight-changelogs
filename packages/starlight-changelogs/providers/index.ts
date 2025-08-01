import { z } from 'astro/zod'

import { stripLeadingAndTrailingSlash } from '../libs/path'

export const StarlightChangelogsLoaderBaseConfigSchema = z.object({
  // TODO(HiDeoo)
  pageSize: z.number().default(5),
  // TODO(HiDeoo) should it be renamed to `base` or something similar?
  // TODO(HiDeoo)
  prefix: z.string().transform((value) => stripLeadingAndTrailingSlash(value)),
  // TODO(HiDeoo)
  title: z.union([z.string(), z.record(z.string())]).default('Changelog'),
})

export type StarlightChangelogsLoaderBaseConfig = z.output<typeof StarlightChangelogsLoaderBaseConfigSchema>
