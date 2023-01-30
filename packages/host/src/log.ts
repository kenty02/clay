import { debugLogSubject } from './trpc/router'

export const log = (message: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.log(message)

  debugLogSubject.next(message)
}
export const logError = (message: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.error(message)

  debugLogSubject.next({ error: message })
}
