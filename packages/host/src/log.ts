import { defer, merge, of, Subject } from 'rxjs'

const debugLogSubject = new Subject<unknown>()
export const debugLogDeferred$ = merge(
  debugLogSubject.asObservable(),
  defer(() => of(allLogs))
)
export const allLogs: Parameters<JSON['stringify']>[0][] = []
export const log = (message: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.log(message)

  debugLogSubject.next(message)
  allLogs.push(message)
}
export const logError = (error: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.error(error)
  const message = { error }

  debugLogSubject.next(message)
  allLogs.push(message)
}

export const logWarn = (warn: Parameters<JSON['stringify']>[0]): void => {
  // this also be logged to ALL extension pages
  console.warn(warn)
  const message = { warn }

  debugLogSubject.next(message)
  allLogs.push(message)
}
