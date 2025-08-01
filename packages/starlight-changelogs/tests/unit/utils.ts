import type { AstroConfig } from 'astro'
import type { LoaderContext } from 'astro/loaders'
import type { DataEntry } from 'astro:content'

export function mockStore() {
  return {
    data: new Map<string, DataEntry>(),
    addModuleImport() {
      // Skip in tests
    },
    clear() {
      this.data.clear()
    },
    delete(id: string) {
      this.data.delete(id)
    },
    entries() {
      return this.data.entries()
    },
    get(id: string) {
      return this.data.get(id)
    },
    has(id: string) {
      return this.data.has(id)
    },
    keys() {
      return this.data.keys()
    },
    set(entry: DataEntry) {
      this.data.set(entry.id, entry)
    },
    values(): DataEntry[] {
      return [...this.data.values()]
    },
  }
}

export function mockLoaderContext(store: ReturnType<typeof mockStore>): LoaderContext {
  return {
    config: {
      root: new URL('.', import.meta.url),
    } as AstroConfig,
    generateDigest: () => 'mock-digest',
    parseData: ({ data }: { data: unknown }) => Promise.resolve(data),
    renderMarkdown: (body: string) => Promise.resolve({ html: body }),
    store: store as unknown as LoaderContext['store'],
  } as unknown as LoaderContext
}
