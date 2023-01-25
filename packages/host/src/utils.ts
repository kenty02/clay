import browser from 'webextension-polyfill'

export const checkFullArray = <T>(array: (T | undefined)[]): array is T[] => {
  return array.indexOf(undefined) === -1
}

interface HasId<U> {
  id: U
}
export function ensureId<T extends { id?: U }, U = number>(data: T): asserts data is T & HasId<U> {
  if (!data.id) throw new IdSomehowNotFoundError()
}

// Dexieで取得したデータに何故かidがない場合
export class IdSomehowNotFoundError extends Error {
  constructor() {
    super(`id somehow not found`)
  }
}

export function searchHistoryByUrl(url: string) {
  return browser.history.search({ text: url })
}
