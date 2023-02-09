import { focusUpdateSubject, nodeUpdateSubject } from './trpc/router'
import browser from 'webextension-polyfill'
import { log, logError } from './log'
import { filter, firstValueFrom, map, tap } from 'rxjs'
import { runtime } from './handlers/rxjs'
import { z } from 'zod'

export const enableDebug = (): void => {
  nodeUpdateSubject.subscribe((nodeUpdate) => {
    log({ type: 'nodeUpdate', nodeUpdate })
  })
  focusUpdateSubject.subscribe((focusUpdate) => {
    log({ type: 'focusUpdate', focusUpdate })
  })

  browser.tabs.onActivated.addListener((activeInfo) =>
    log({ type: 'tabs.onActivated', ...activeInfo })
  )
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
    log({ type: 'tabs.onUpdated', tabId, changeInfo, tab })
  )
  browser.tabs.onRemoved.addListener((tabId) => log({ type: 'tabs.onRemoved', tabId }))
  browser.history.onVisited.addListener((r) => log({ type: 'history.onVisited', ...r }))
  browser.history.onVisitRemoved.addListener((r) => log({ type: 'history.onVisitRemoved', ...r }))
  browser.webNavigation.onCommitted.addListener((r) =>
    log({ type: 'webNavigation.onCommitted', ...r })
  )
  browser.webNavigation.onBeforeNavigate.addListener((r) =>
    log({ type: 'webNavigation.onBeforeNavigate', ...r })
  )
}

export const testOptionsSchema = z.object({
  type: z.literal('testOptions'),
  relayPort: z.number()
})
/* eslint-disable @typescript-eslint/no-explicit-any */
export type TestOptions = z.infer<typeof testOptionsSchema>
const mesParseResultNotNull = (
  value:
    | { message: TestOptions; sendResponse: (response?: any) => void }
    | { message: undefined; sendResponse: (response?: any) => void }
): value is { message: TestOptions; sendResponse: (response?: any) => void } =>
  value.message !== undefined
export const getTestOptions = async (): Promise<{
  message: TestOptions
  sendResponse: (response?: any) => void
}> => {
  return await firstValueFrom(
    runtime.messageExternalStream.pipe(
      map(([message, sender, sendResponse]) => ({
        result: testOptionsSchema.safeParse(message),
        sender,
        sendResponse
      })),
      tap(
        ({ result }) =>
          !result.success &&
          logError({ message: 'expected testOption but got error', error: result.error })
      ),
      map(({ result, sendResponse }) => ({
        message: result.success ? result.data : undefined,
        sendResponse
      })),
      filter(mesParseResultNotNull)
    )
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const playWrightReady = (): void => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    void chrome.tabs.remove(tabs[0].id!)
  })
}
