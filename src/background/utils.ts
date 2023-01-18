import browser from 'webextension-polyfill'
import { features } from '../feature-flags'

export const isChrome = chrome.tabGroups !== undefined

let currentNotifyInterval: (() => void) | null = null

export async function notifyUser(message: string) {
  if (isChrome && features.newNotification) {
    //geturl
    const pinnedTabUrl = chrome.runtime.getURL('manifest.json') // あとで変える
    let existingTabs = await chrome.tabs.query({ url: pinnedTabUrl })
    if (existingTabs.length > 1) {
      // invalid amount, delete all
      await chrome.tabs.remove(existingTabs.map((tab) => tab.id!))
      existingTabs = []
    }
    if (existingTabs.length === 1) {
      const groupId = existingTabs[0].groupId
      if (groupId) {
        // move to group
        // await chrome.tabs.group({ tabIds: [ existingTabs[0].id! ] })
        const group = await chrome.tabGroups.get(groupId)
        currentNotifyInterval?.()
        group.title = message
        return
      }
    } else {
    }
    const createdTab = await chrome.tabs.create({ url: 'about:blank', pinned: true, active: false })
  } else {
    await browser.notifications.create({
      type: 'basic',
      title: 'Clay',
      message,
      iconUrl: browser.runtime.getURL('icon-32.png')
    })
  }
}
