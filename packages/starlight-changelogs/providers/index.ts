import { z } from 'astro/zod'

import { stripLeadingAndTrailingSlash } from '../libs/path'

export const ProviderBaseConfigSchema = z.object({
  // TODO(HiDeoo)
  pageSize: z.number().default(5),
  // TODO(HiDeoo)
  base: z.string().transform((value) => stripLeadingAndTrailingSlash(value)),
  // TODO(HiDeoo)
  title: z.union([z.string(), z.record(z.string())]).default('Changelog'),
})

export type ProviderBaseConfig = z.output<typeof ProviderBaseConfigSchema>
