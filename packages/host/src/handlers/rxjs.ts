/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { fromEventPattern, merge, Observable, Observer, Subject } from 'rxjs'

function fromChromeEvent<
  T extends chrome.events.Event<(...args: unknown[]) => void>,
  R = Parameters<Parameters<T['addListener']>[0]>
>(event: T, key: string): Observable<R> & { mock: Observer<R> } {
  const original = fromEventPattern(
    (handler) => {
      event.addListener(handler)
    },
    (handler) => {
      event.removeListener(handler)
    },
    (...args) => args as R
  )

  const mock = new Subject<R>()
  const merged = merge(original, mock)
  return Object.defineProperty(merged, 'mock', { value: mock }) as Observable<R> & {
    mock: Observer<R>
  }
}

export const tabs = {
  get activationStream() {
    return fromChromeEvent(chrome.tabs.onActivated, 'tabs.onActivated')
  }
}

export const runtime = {
  get messageExternalStream() {
    return fromChromeEvent(chrome.runtime.onMessageExternal, 'runtime.onMessageExternal')
  }
}
