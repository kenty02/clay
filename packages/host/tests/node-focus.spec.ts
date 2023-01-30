import { expect, test } from './fixtures'

const stringifyBase = require('json-stable-stringify')
const stringify = (obj: unknown): string => stringifyBase(obj, { space: 2 })

test('focuses switch ok', async ({ page, client, doSurfing }) => {
  void page // fixme
  // observed into normalized id
  const focusTabIdMap: Map<number, number> = new Map()

  const focusUpdates = []
  const currentFocuses = []
  client.focus.onUpdate.subscribe(undefined, {
    onData: (data) => {
      let tabId
      if (focusTabIdMap.has(data.tabId)) {
        tabId = focusTabIdMap.get(data.tabId)
      } else {
        tabId = focusTabIdMap.size
        focusTabIdMap.set(data.tabId, tabId)
      }
      focusUpdates.push({ ...data, tabId })

      const index = currentFocuses.findIndex((u) => u.id === data.id)
      if (index === -1) currentFocuses.push({ ...data, tabId })
      else {
        currentFocuses[index] = { ...currentFocuses[index], ...data, tabId }
      }
    }
  })

  await doSurfing("Let's Encrypt 2 focuses")

  const allIds = await client.node.getAllFocusedAndItsRelatives.query()
  const nodes = await Promise.all(allIds.map((id) => client.node.get.query({ nodeId: id })))
  // sort by id
  nodes.sort((a, b) => a.id - b.id)
  currentFocuses.sort((a, b) => a.id - b.id)
  const focuses = (await client.focus.getAll.query()).map((f) => {
    let tabId
    if (focusTabIdMap.has(f.tabId)) {
      tabId = focusTabIdMap.get(f.tabId)
    } else {
      tabId = focusTabIdMap.size
      focusTabIdMap.set(f.tabId, tabId)
    }
    return { ...f, tabId }
  })

  console.log({ focusTabIdMap })
  expect.soft(stringify(focuses)).toMatchSnapshot('2fs-focuses.json')
  expect.soft(currentFocuses).toMatchObject(focuses)
  expect.soft(stringify(focusUpdates)).toMatchSnapshot('2fs-focus-updates.json')
  expect.soft(stringify(nodes)).toMatchSnapshot('2fs-nodes.json')
})
