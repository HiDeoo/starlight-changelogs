import { z } from 'astro/zod'

import { ensureLeadingSlash } from './path'
import { throwPluginError } from './plugin'

const sidebarLinkBaseConfigSchema = z.object({
  /**
   * The base path used for the changelog this link points to.
   * This should match the `base` used in the changelog loader configuration.
   */
  base: z.string(),
})

const sidebarLinkConfigSchema = z
  .discriminatedUnion('type', [
    sidebarLinkBaseConfigSchema.extend({
      /** The type of link, `all` in this case to link to the changelog version list. */
      type: z.literal('all'),
      /**
       * The label of the sidebar link.
       *
       * The value can be a string, or for multilingual sites, an object with values for each different locale. When
       * using the object form, the keys must be BCP-47 tags (e.g. `en`, `fr`, or `zh-CN`).
       */
      label: z.union([z.string(), z.record(z.string())]),
    }),
    sidebarLinkBaseConfigSchema.extend({
      /** The type of link, `all` in this case to link to the changelog latest version. */
      type: z.literal('latest'),
      /**
       * The label of the sidebar link.
       *
       * The value can be a string, or for multilingual sites, an object with values for each different locale. When
       * using the object form, the keys must be BCP-47 tags (e.g. `en`, `fr`, or `zh-CN`).
       */
      label: z.union([z.string(), z.record(z.string())]),
    }),
    sidebarLinkBaseConfigSchema.extend({
      /** The type of links, `recent` in this case to link to multiple recent versions. */
      type: z.literal('recent'),
      /**
       * The number of recent versions to display in the sidebar.
       *
       * @default 5
       */
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
