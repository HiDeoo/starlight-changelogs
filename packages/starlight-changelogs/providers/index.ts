import { z } from 'astro/zod'

import { stripLeadingAndTrailingSlash } from '../libs/path'

export const ProviderBaseConfigSchema = z.object({
  // TODO(HiDeoo)
  pageSize: z.number().default(5),
  // TODO(HiDeoo)
  base: z.string().transform((value) => stripLeadingAndTrailingSlash(value)),
  // TODO(HiDeoo)
  title: z.union([z.string(), z.record(z.string())]).default('Changelog'),
  // TODO(HiDeoo)
  process: z
    .function()
    .args(
      z.object({
        // TODO(HiDeoo)
        title: z.string(),
      }),
    )
    .returns(z.union([z.string(), z.undefined(), z.void()]))
    .optional(),
})

export type ProviderBaseConfig = z.output<typeof ProviderBaseConfigSchema>
