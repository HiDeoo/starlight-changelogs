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
  pagefind: z.boolean().default(true),
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

export const SerializedProviderBaseConfigSchema = ProviderBaseConfigSchema.pick({
  base: true,
  pagefind: true,
  pageSize: true,
  title: true,
})

export type ProviderBaseConfig = z.output<typeof SerializedProviderBaseConfigSchema>
