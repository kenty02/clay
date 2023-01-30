/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { fromEventPattern, Observable } from 'rxjs'

function fromChromeEvent<
  T extends chrome.events.Event<(...args: unknown[]) => void>,
  R = Parameters<Parameters<T['addListener']>[0]>
>(event: T): Observable<R> {
  return fromEventPattern(
    (handler) => {
      event.addListener(handler)
    },
    (handler) => {
      event.removeListener(handler)
    },
    (...args) => args as R
  )
}

export const tabs = {
  get activationStream() {
    return fromChromeEvent(chrome.tabs.onActivated)
  }
}

export const runtime = {
  get messageExternalStream() {
    return fromChromeEvent(chrome.runtime.onMessageExternal)
  }
}
