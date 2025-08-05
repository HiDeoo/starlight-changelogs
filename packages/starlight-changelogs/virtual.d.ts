declare module 'virtual:starlight-changelogs/config' {
  export const getLoaderConfig: import('./libs/vite').StarlightChangelogsConfig['getLoaderConfig']
  export const setLoaderConfig: import('./libs/vite').StarlightChangelogsConfig['setLoaderConfig']
}

declare module 'virtual:starlight-changelogs/context' {
  const StarlightChangelogsContext: import('./libs/vite').StarlightChangelogsContext

  export default StarlightChangelogsContext
}
