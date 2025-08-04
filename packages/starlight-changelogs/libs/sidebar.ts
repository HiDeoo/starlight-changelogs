import { z } from 'astro/zod'

import { ensureLeadingSlash } from './path'
import { throwPluginError } from './plugin'

const sidebarLinkBaseConfigSchema = z.object({
  // TODO(HiDeoo)
  base: z.string(),
})

const sidebarLinkConfigSchema = z
  .discriminatedUnion('type', [
    sidebarLinkBaseConfigSchema.extend({
      // TODO(HiDeoo)
      type: z.literal('all'),
      // TODO(HiDeoo)
      label: z.union([z.string(), z.record(z.string())]),
    }),
    sidebarLinkBaseConfigSchema.extend({
      // TODO(HiDeoo)
      type: z.literal('latest'),
      // TODO(HiDeoo)
      label: z.union([z.string(), z.record(z.string())]),
    }),
    sidebarLinkBaseConfigSchema.extend({
      // TODO(HiDeoo)
      type: z.literal('recent'),
      // TODO(HiDeoo)
      count: z.number().default(5),
    }),
  ])
  .array()

export function makeChangelogsSidebarLinks(userConfig: SidebarLinkUserConfig) {
  const parsedConfig = sidebarLinkConfigSchema.safeParse(userConfig)

  if (!parsedConfig.success) {
    throwPluginError(
      `The provided starlight-changelogs sidebar links configuration is invalid.\n${parsedConfig.error.issues.map((issue) => issue.message).join('\n')}`,
    )
  }

  return parsedConfig.data.map((config) => ({
    label: JSON.stringify(config.type === 'recent' ? 'Recent' : config.label),
    link: ensureLeadingSlash(config.base),
    attrs: {
      'data-sl-changelogs-link-base': config.base,
      'data-sl-changelogs-link-type': config.type,
      'data-sl-changelogs-link-count': config.type === 'recent' ? config.count : undefined,
    },
  }))
}

type SidebarLinkUserConfig = z.input<typeof sidebarLinkConfigSchema>
export type SidebarLinkConfig = z.output<typeof sidebarLinkConfigSchema>
