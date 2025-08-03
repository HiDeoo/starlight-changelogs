import { fileURLToPath } from 'node:url'

import type { HookParameters as StarlightHookParameters } from '@astrojs/starlight/types'
import type { AstroConfig, HookParameters as AstroHookParameters, ViteUserConfig } from 'astro'

import { getLoaderConfigUrl } from '../loader/config'
import type { ProviderBaseConfig } from '../providers'

export function vitePluginStarlightChangelogs(
  astroConfig: AstroConfig,
  starlightConfig: StarlightConfig,
  command: AstroHookParameters<'astro:config:setup'>['command'],
): VitePlugin {
  const modules = {
    'virtual:starlight-changelogs/config': getConfigVirtualModule(astroConfig, command),
    'virtual:starlight-changelogs/context': `export default ${JSON.stringify({
      defaultLocale: starlightConfig.defaultLocale,
      isMultilingual: Object.keys(starlightConfig.locales ?? {}).length > 1,
      locales: starlightConfig.locales,
      title: starlightConfig.title,
      titleDelimiter: starlightConfig.titleDelimiter ?? '|',
      trailingSlash: astroConfig.trailingSlash,
    } satisfies StarlightChangelogsContext)}`,
  }

  const moduleResolutionMap = Object.fromEntries(
    (Object.keys(modules) as (keyof typeof modules)[]).map((key) => [resolveVirtualModuleId(key), key]),
  )

  return {
    name: 'vite-plugin-starlight-changelogs',
    load(id) {
      const moduleId = moduleResolutionMap[id]
      return moduleId ? modules[moduleId] : undefined
    },
    resolveId(id) {
      return id in modules ? resolveVirtualModuleId(id) : undefined
    },
  }
}

function resolveVirtualModuleId<TModuleId extends string>(id: TModuleId): `\0${TModuleId}` {
  return `\0${id}`
}

function getConfigVirtualModule(
  astroConfig: AstroConfig,
  command: AstroHookParameters<'astro:config:setup'>['command'],
) {
  return command === 'dev'
    ? `let loaderConfig = []

export function getLoaderConfig() {
  return loaderConfig
}

export function setLoaderConfig(newLoaderConfig) {
  loaderConfig = newLoaderConfig
}`
    : `import fs from 'node:fs'

const loaderConfigPath = ${JSON.stringify(fileURLToPath(getLoaderConfigUrl(astroConfig)))}
let loaderConfig

export function getLoaderConfig() {
  if (loaderConfig) return loaderConfig
  loaderConfig = JSON.parse(fs.readFileSync(loaderConfigPath, 'utf8'))
  return loaderConfig
}

export function setLoaderConfig() {
  // no-op in production
}`
}

export interface StarlightChangelogsConfig {
  getLoaderConfig: () => ProviderBaseConfig[]
  setLoaderConfig: (newLoaderConfig: ProviderBaseConfig[]) => void
}

export interface StarlightChangelogsContext {
  defaultLocale: StarlightConfig['defaultLocale']
  isMultilingual: boolean
  locales: StarlightConfig['locales']
  title: StarlightConfig['title']
  titleDelimiter: StarlightConfig['titleDelimiter']
  trailingSlash: AstroConfig['trailingSlash']
}

type StarlightConfig = StarlightHookParameters<'config:setup'>['config']

type VitePlugin = NonNullable<ViteUserConfig['plugins']>[number]
