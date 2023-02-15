import { expect, test } from './fixtures'
import { stringify } from './utils'

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
  const nodeUpdates = []
  const currentNodes = []
  client.node.onUpdate.subscribe(undefined, {
    onData: (data) => {
      nodeUpdates.push({ ...data })

      const index = currentNodes.findIndex((u) => u.id === data.id)
      if (index === -1) currentNodes.push({ ...data })
      else {
        currentNodes[index] = { ...currentNodes[index], ...data }
      }
    }
  })

  await doSurfing("Let's Encrypt 2 focuses")

  const allIds = await client.node.getAllFocusedAndItsRelatives.query()
  const nodes = await client.node.bulkGet.query({ nodeIds: allIds })
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
  expect
    .soft(focuses.filter((f) => currentFocuses.some((ff) => f.id === ff.id)))
    .toMatchObject(currentFocuses)
  expect.soft(stringify(focusUpdates)).toMatchSnapshot('2fs-focus-updates.json')
  expect.soft(stringify(nodes)).toMatchSnapshot('2fs-nodes.json')

  expect
    .soft(nodes.filter((f) => currentNodes.some((ff) => f.id === ff.id)))
    .toMatchObject(currentNodes.sort((a, b) => a.id - b.id))
})
