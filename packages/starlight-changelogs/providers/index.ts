import { z } from 'astro/zod'

export const StarlightChangelogsLoaderBaseConfigSchema = z.object({
  // TODO(HiDeoo) should it be renamed to `base` or something similar?
  // TODO(HiDeoo) transform remove leading and trailing slashes
  // TODO(HiDeoo)
  prefix: z.string(),
})
