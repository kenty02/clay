import { focusUpdateSubject, nodeUpdateSubject } from './trpc/router'
import browser from 'webextension-polyfill'
import { log } from './log'

export const enableDebug = (): void => {
  nodeUpdateSubject.subscribe((nodeUpdate) => {
    console.log('nodeUpdate', nodeUpdate)
  })
  focusUpdateSubject.subscribe((focusUpdate) => {
    console.log('focusUpdate', focusUpdate)
  })

  browser.tabs.onActivated.addListener((activeInfo) =>
    log({ type: 'tabs.onActivated', ...activeInfo })
  )
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) =>
    log({ type: 'tabs.onUpdated', tabId, changeInfo, tab })
  )
  browser.tabs.onRemoved.addListener((tabId) =>
    log(JSON.stringify({ type: 'tabs.onRemoved', tabId }))
  )
  browser.history.onVisited.addListener((r) => log({ type: 'history.onVisited', ...r }))
  browser.history.onVisitRemoved.addListener((r) => log({ type: 'history.onVisitRemoved', ...r }))
  browser.webNavigation.onCommitted.addListener((r) =>
    log({ type: 'webNavigation.onCommitted', ...r })
  )
  browser.webNavigation.onBeforeNavigate.addListener((r) =>
    log({ type: 'webNavigation.onBeforeNavigate', ...r })
  )
}
