import {debugLogSubject} from "./trpc/router";

export const log = (message: Parameters<JSON['stringify']>[0]) => {
  // this also be logged to ALL extension pages
  console.log(message)

  debugLogSubject.next(message)
}
