import type { AstroConfig } from 'astro'
import type { LoaderContext } from 'astro/loaders'
import type { DataEntry } from 'astro:content'

import type { VersionEntry } from '../loader/schema'

export function mockStore() {
  const data = new Map<string, MockEntry>()

  return {
    data,
    addModuleImport() {
      // Skip in tests
    },
    clear() {
      data.clear()
    },
    delete(id: string) {
      data.delete(id)
    },
    entries() {
      return data.entries()
    },
    get(id: string) {
      return data.get(id)
    },
    has(id: string) {
      return data.has(id)
    },
    keys() {
      return data.keys()
    },
    set(entry: MockEntry) {
      data.set(entry.id, entry)
    },
    values(): MockEntry[] {
      return data.values().toArray()
    },
  }
}

export function mockLoaderContext(store: ReturnType<typeof mockStore>): LoaderContext {
  return {
    config: {
      root: new URL('.', import.meta.url),
    } as AstroConfig,
    generateDigest: (data: unknown) => JSON.stringify(data),
    logger: { warn: () => undefined },
    meta: mockMeta(),
    parseData: ({ data }: { data: unknown }) => Promise.resolve(data),
    renderMarkdown: (body: string) => Promise.resolve({ html: body }),
    store: store as unknown as LoaderContext['store'],
  } as unknown as LoaderContext
}

function mockMeta() {
  const data = new Map<string, unknown>()

  return {
    data,
    clear() {
      data.clear()
    },
    delete(key: string) {
      data.delete(key)
    },
    get(key: string) {
      return data.get(key)
    },
    has(key: string) {
      return data.has(key)
    },
    set(key: string, value: unknown) {
      data.set(key, value)
    },
  }
}

type MockEntry = DataEntry & {
  data: VersionEntry
}
