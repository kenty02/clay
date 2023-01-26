import browser from 'webextension-polyfill'
import { log } from '../log'

export const handleHistoryEvents = (): void => {
  browser.history.onVisited.addListener((r) => {
    log({ type: 'history.onVisited', ...r })
  })
  browser.history.onVisitRemoved.addListener((r) => {
    log({ type: 'history.onVisitRemoved', ...r })
  })
}
