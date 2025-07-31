import { fileURLToPath } from 'node:url'

import type { AstroConfig, HookParameters, ViteUserConfig } from 'astro'

import { getLoaderConfigUrl, type StarlightChangelogsLoaderConfig } from '../loader/config'

export function vitePluginStarlightChangelogs(
  astroConfig: AstroConfig,
  command: HookParameters<'astro:config:setup'>['command'],
): VitePlugin {
  const moduleId = 'virtual:starlight-changelogs/config'
  const resolvedModuleId = `\0${moduleId}`

  const moduleContent =
    command === 'dev'
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

  return {
    name: 'vite-plugin-starlight-changelogs',
    load(id) {
      return id === resolvedModuleId ? moduleContent : undefined
    },
    resolveId(id) {
      return id === moduleId ? resolvedModuleId : undefined
    },
  }
}

export interface StarlightChangelogsConfig {
  getLoaderConfig: () => StarlightChangelogsLoaderConfig
  setLoaderConfig: (newLoaderConfig: StarlightChangelogsLoaderConfig) => void
}

type VitePlugin = NonNullable<ViteUserConfig['plugins']>[number]
