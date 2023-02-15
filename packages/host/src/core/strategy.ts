import browser from 'webextension-polyfill'
import { db, IFocus, INode } from '../db'
import { checkFullArray, ensureId } from '../utils'
import { log, logError, logWarn } from '../log'
import { focusUpdateSubject, nodeUpdateSubject } from '../trpc/router'
import { tabs } from '../handlers/rxjs'
import AsyncLock from 'async-lock'

export const openedTabs = new Set<number>()
// key = tabId
const newlyOpenedTabsAndOpener = new Map<number, number>()
export const syncAllFocus = async (): Promise<void> => {
  const focuses = await db.focus.toArray()
  const tabs = await browser.tabs.query({})
  const unpairedFocuses = focuses.filter((f) => !tabs.find((t) => t.id === f.tabId))
  const unpairedTabs = tabs.filter((t) => !focuses.find((f) => f.tabId === t.id))
  for (const f of unpairedFocuses) {
    const { id, tabId } = f
    logError(`syncAllFocus: tab ${tabId} of focus ${id} not found, remove focus`)
    await db.focus.delete(id!)
  }
  for (const t of unpairedTabs) {
    const { id } = t
    logWarn(`syncAllFocus: tab ${id} not found in focus, creating node and focus`)
    const nodeId = await db.node.add({ url: t.url!, childrenIds: [], title: t.title! })
    await db.focus.add({ tabId: id!, active: false, nodeId: nodeId })
  }
}

// I don't wanna save this to db
interface ExtendedVisitItem extends browser.History.VisitItem {
  url: string
}

db.node.hook('creating', function (primKey, obj) {
  this.onsuccess = (id): void => {
    void notifyNodeUpdate({ ...obj, id })
  }
})
db.node.hook('updating', function () {
  this.onsuccess = (updated): void => {
    void notifyNodeUpdate(updated)
  }
})
db.focus.hook('creating', function (primKey, obj) {
  this.onsuccess = (id): void => {
    void notifyFocusUpdate({ ...obj, id })
  }
})
db.focus.hook('updating', function () {
  this.onsuccess = (updated): void => {
    void notifyFocusUpdate(updated)
  }
})

export const notifyNodeUpdate = async (node: INode): Promise<void> => {
  nodeUpdateSubject.next({
    id: node.id!,
    ...node
  })
}
export const notifyFocusUpdate = (focus: IFocus): void => {
  focusUpdateSubject.next({
    id: focus.id!,
    ...focus
  })
}
// 既存タブのURL変更、または新しいタブ作成時に呼び出し
export const handleUrlChanged = async (
  // data: browser.WebNavigation.OnCommittedDetailsType
  data: { url: string; tabId: number; openerTabId?: number; isFrontTab: boolean; title: string }
): Promise<void> => {
  // URLが遷移した
  log('handleUrlChanged, New/MoveTo ' + data.url)

  const computeTransitionInfo = async (): Promise<{
    isNewTab: boolean
    openerFocus?: IFocus
    tabId: number
  }> => {
    // 対象タブID
    const thisTabId = data.tabId
    // URLが新しいタブで開かれたか？
    let isNewTab = false
    if (!openedTabs.has(data.tabId)) {
      isNewTab = true
      openedTabs.add(data.tabId)
    }
    console.assert(data.openerTabId !== thisTabId)

    // 「他タブ要因によって」「新しいタブが開かれた場合のみ」元タブIDがセットされる
    const openerTabId = isNewTab ? data.openerTabId : undefined

    let shouldCreateNewTree = false
    // force newtab to new tree
    if (data.url === 'chrome://newtab/') {
      shouldCreateNewTree = true
    }

    // 既存タブの場合、現在のフォーカス。新規タブの場合、原因となったフォーカス。
    const openerTabFocus = await db.focus
      .where('tabId')
      .equals(openerTabId ?? thisTabId)
      .first()
    if (!openerTabFocus) {
      if (openerTabId != null) logError('expected focus for tab but got null, creating new tree')
      shouldCreateNewTree = true
    }
    return {
      isNewTab: isNewTab,
      openerFocus: shouldCreateNewTree ? undefined : openerTabFocus,
      tabId: thisTabId
    }
  }
  const transition = await computeTransitionInfo()

  if (!transition.openerFocus) {
    log('this is independent tab, create new tree')
    // or tab is opened by another tab, ...
    // create node at new tree
    const newNode: INode = {
      url: data.url,
      childrenIds: [],
      title: data.title
    }
    const nodeId = await db.node.add(newNode)
    newNode.id = nodeId
    const newFocus: IFocus = { tabId: data.tabId, nodeId, active: data.isFrontTab }
    const focusId = await db.focus.add(newFocus)
    newFocus.id = focusId
  } else {
    // create or move?
    const openerFocusNodeId = transition.openerFocus.nodeId
    const openerFocusNode = await db.node.get(openerFocusNodeId)
    if (!openerFocusNode) {
      logError('openerNode not found')
      return
    }

    // childrenから遷移先nodeの探索を試す
    const openerNodeChildren = await db.node.bulkGet(openerFocusNode.childrenIds)
    if (!checkFullArray(openerNodeChildren)) {
      logError('children has undefined')
      return
    }
    // openerNodeChildrenの中で、変更後URLと同じURLがセットされているものを探す。
    const childNodeMoveTo = (
      await Promise.all(openerNodeChildren.map(async (child) => child?.url === data.url)).then(
        (bits) => openerNodeChildren.filter(() => bits.shift())
      )
    )[0]

    // 逆に、parentは遷移先nodeとなり得るか調べる
    let parentNodeMoveTo: INode | null = null
    if (openerFocusNode.parentId) {
      const parent = await db.node.get(openerFocusNode.parentId)
      if (parent && parent.url === data.url) {
        parentNodeMoveTo = parent
      }
    }

    // ひとまず親ノードを優先
    // 遷移先ノード、または無ければnull。
    const nodeMoveTo = parentNodeMoveTo
      ? parentNodeMoveTo
      : childNodeMoveTo
      ? childNodeMoveTo
      : null

    if (nodeMoveTo) {
      // フォーカス追加or移動のみ
      // move!
      log('just move focus!')
      ensureId(nodeMoveTo)
      if (transition.isNewTab) {
        // タブが複製された
        const newFocus: IFocus = {
          nodeId: nodeMoveTo.id,
          tabId: transition.tabId,
          active: data.isFrontTab
        }
        const focusId = await db.focus.add(newFocus)
        newFocus.id = focusId
      } else {
        // 既存のタブでリンク遷移（元のページに戻る/進む）
        await db.focus.update(transition.openerFocus, {
          nodeId: nodeMoveTo.id
        })
      }
    } else {
      // 既存のツリーにノード追加、フォーカス追加or移動
      log('create and move focus!')

      const newNode = await createNode(
        { url: data.url, parentId: openerFocusNodeId, childrenIds: [], title: data.title },
        openerFocusNode
      )

      if (transition.isNewTab) {
        // 「新しいタブで開く」
        const newFocus: IFocus = {
          nodeId: newNode.id!,
          tabId: transition.tabId,
          active: data.isFrontTab
        }
        const focusId = await db.focus.add(newFocus)
      } else {
        // 既存のタブでリンク遷移
        await db.focus.update(transition.openerFocus, {
          nodeId: newNode.id
        })
      }
    }
  }
}
const createNode = async (nodeData: INode, parentNode: INode): Promise<INode> => {
  const newNodeId = await db.node.add(nodeData)
  await db.node.update(parentNode, {
    childrenIds: [...parentNode.childrenIds, newNodeId]
  })
  return { id: newNodeId, ...nodeData }
}

export const startStrategy = async (): Promise<void> => {
  await syncAllFocus()
  tabs.activationStream.subscribe(([activeInfo]) => {
    ;(async (): Promise<void> => {
      if (!openedTabs.has(activeInfo.tabId)) {
        // tabs.onUpdate listener will handle this (create new focus)
        log("tabs.onActivated ignored (not modifying focus because it doesn't exist)")
        return
      }
      // FIXME: supports only single window
      const allActiveFocus = await db.focus.filter((f) => f.active).toArray()
      const focusOfThisTab = await db.focus.where('tabId').equals(activeInfo.tabId).first()
      if (!focusOfThisTab) {
        logError(`no focus at active tabId ${activeInfo.tabId}`)
        return
      }
      for (const activeFocus of allActiveFocus) {
        if (activeFocus.id !== focusOfThisTab.id) {
          await db.focus.update(activeFocus, { active: false })
        }
      }
      await db.focus.update(focusOfThisTab, { active: true })
    })().catch(logError)
  })

  const tabUpdateLock = new AsyncLock()
  let testCount = 0
  // タブに関するあらゆる更新情報が来る
  // Duplicate&Newの際にフォーカス及びノードを正しく関連付けられるようにするため
  // 特に、タブを複製した場合onCommittedは呼ばれずこっちのみが呼ばれる
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 各tabのupdateが必ず順番に処理されるようにする
    tabUpdateLock
      .acquire(String(tabId), async () => {
        if (!tab.url || !tab.title) {
          logError('tabs permission not granted?')
          return
        }

        if (changeInfo.url) {
          // URL変更(つまり遷移)が発生
          // 同じURLのリンク踏んでも発生しない!
          log(`${testCount++}th transition, url changed (in current or new tab)`)
          await handleUrlChanged({
            url: tab.url,
            tabId,
            openerTabId: tab.openerTabId,
            isFrontTab: tab.active,
            title: tab.title
          })

          //   const transitionInfo = await getTransitionInfo(tabId);
          // if(transitionInfo) {
          //   log("transitionInfo available")
          // }
        } else if (changeInfo.title) {
          // urlは変更しなかったが、タイトルが変更された
          log(
            `title changed with url unchanged: "${changeInfo.title}" at tabId ${tabId} url: ${tab.url}`
          )
          const focus = await db.focus.where('tabId').equals(tabId).first()
          if (!focus) {
            logError(`attempted to change title of node, but no focus at tabId ${tabId}`)
            return
          }
          const node = await db.node.get(focus.nodeId)
          if (!node) {
            logError(`attempted to change title of node, but no node  ${focus.nodeId}`)
            return
          }
          await db.node.update(node, { title: changeInfo.title })
        }
        // if (openedTabs.has(tabId)) return;
        // openedTabs.add(tabId);
        // 新規タブが作成された
      })
      .catch(logError)
  })

  browser.tabs.onRemoved.addListener((tabId) => {
    ;(async (): Promise<void> => {
      openedTabs.delete(tabId)
      const focus = await db.focus.where('tabId').equals(tabId).first()
      if (focus) {
        // focusが存在する場合削除
        ensureId(focus)
        await db.focus.delete(focus.id)
      } else {
        // 存在しない場合は本来の設計としておかしい
        logError(
          `tab ${tabId} closed but focus not found...? (probably it's created before clay start)`
        )
      }
    })().catch(logError)
  })
}
