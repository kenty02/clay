import browser from 'webextension-polyfill'
import { log } from '../log'

export const handleWebNavigationEvents = (): void => {
  browser.webNavigation.onCommitted.addListener((r) => {
    log({ type: 'webNavigation.onCommitted', ...r })
  })
  browser.webNavigation.onBeforeNavigate.addListener((r) => {
    log({ type: 'webNavigation.onBeforeNavigate', ...r })
  })
}
