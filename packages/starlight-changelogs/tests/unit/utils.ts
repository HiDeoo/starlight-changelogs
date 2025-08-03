import type { AstroConfig } from 'astro'
import type { LoaderContext } from 'astro/loaders'
import type { DataEntry } from 'astro:content'

import type { VersionEntry } from '../../loader/schema'

export function mockStore() {
  return {
    data: new Map<string, MockEntry>(),
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
    set(entry: MockEntry) {
      this.data.set(entry.id, entry)
    },
    values(): MockEntry[] {
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
    meta: mockMeta(),
    parseData: ({ data }: { data: unknown }) => Promise.resolve(data),
    renderMarkdown: (body: string) => Promise.resolve({ html: body }),
    store: store as unknown as LoaderContext['store'],
  } as unknown as LoaderContext
}

function mockMeta() {
  return {
    data: new Map<string, unknown>(),
    clear() {
      this.data.clear()
    },
    delete(key: string) {
      this.data.delete(key)
    },
    get(key: string) {
      return this.data.get(key)
    },
    has(key: string) {
      return this.data.has(key)
    },
    set(key: string, value: unknown) {
      this.data.set(key, value)
    },
  }
}

type MockEntry = DataEntry & {
  data: VersionEntry
}
