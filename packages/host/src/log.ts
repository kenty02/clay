import { debugLogSubject } from './trpc/router'

export const log = (message: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.log(message)

  debugLogSubject.next(typeof message === 'string' ? { message } : message)
}
