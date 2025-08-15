import { z } from 'astro/zod'

import { stripLeadingAndTrailingSlash } from '../libs/path'

export const ProviderBaseConfigSchema = z.object({
  /**
   * The base path to use for this changelog.
   *
   * For example, setting this option to `changelog` will result in the changelog version list being available at
   * `/changelog/` and a version entry at `/changelog/versions/0.1.0/`.
   */
  base: z.string().transform((value) => stripLeadingAndTrailingSlash(value)),
  /**
   * Defines whether this specific changelog is enabled.
   *
   * When set to `false`, changelog data will not be loaded and no changelog pages or sidebar links will be generated
   * for this changelog.
   * This can be useful to disable a changelog depending on some environment variable that may not always be available.
   *
   * @default true
   */
  enabled: z.boolean().default(true),
  /**
   * Defines whether the changelog pages should be indexed by Pagefind, Starlight's default site search provider.
   *
   * @default true
   * @see https://starlight.astro.build/reference/configuration/#pagefind
   */
  pagefind: z.boolean().default(true),
  /**
   * The number of versions to display per page in the changelog version list.
   *
   * @default 10
   */
  pageSize: z.number().default(10),
  /**
   * An optional function called for every version entry in the changelog which can be used to either modify the version
   * title or filter out certain versions.
   *
   * The function receives the version title found in the changelog and can use it to return an updated title or
   * `undefined` to filter out this specific version.
   *
   * Filtering out versions can be useful for example when using the GitHub provider on a monorepo publishing releases
   * for multiple packages, and only changes for a specific package should be shown in the changelog.
   */
  process: z
    .function()
    .args(
      z.object({
        /** The version title found in the changelog. */
        title: z.string(),
      }),
    )
    .returns(z.union([z.string(), z.undefined(), z.void()]))
    .optional(),
  /**
   * The title of the changelog.
   *
   * The value can be a string, or for multilingual sites, an object with values for each different locale. When using
   * the object form, the keys must be BCP-47 tags (e.g. `en`, `fr`, or `zh-CN`).
   *
   * @default 'Changelog'
   */
  title: z.union([z.string(), z.record(z.string())]).default('Changelog'),
})

export const SerializedProviderBaseConfigSchema = ProviderBaseConfigSchema.pick({
  base: true,
  enabled: true,
  pagefind: true,
  pageSize: true,
  title: true,
})

export type ProviderBaseConfig = z.output<typeof SerializedProviderBaseConfigSchema>
