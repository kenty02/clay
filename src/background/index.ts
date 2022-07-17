import browser from "webextension-polyfill";
import {onMessage} from "webext-bridge";
import {db} from "../db";
import {checkFullArray, ensureId, log} from "../utils";

const optionUrl = browser.runtime.getURL("options/options.html");
browser.tabs.create({ url: optionUrl });
console.log("hello world!");
// test data
// setTimeout(() => {
//   db.node.bulkAdd([
//     {
//       url: "http://test2.com",
//       childrenIds: [],
//       absolutePosition: { col: 1, row: 0 },
//     },
//   ]);
// }, 1000);

onMessage("ping", ({ data: { pongMessage }, ...rest }) => {
  rest.sender;
  console.log("Got Pong!");
  console.log(pongMessage);
  return;
});

export const getPing = () => {
  return "Ping!";
};

const openedTabs = new Set<number>();
const newlyOpenedTabsAndOpener = new Map<number, number>();
// key = tabId
const waiters = new Map<number, () => void>();
const waitForTabInfo = (tabId: number) =>
  new Promise<void>((resolve) => {
    waiters.set(tabId, () => resolve());
  });
const tabInfoSet = (tabId: number) => {
  const waiter = waiters.get(tabId);
  if (waiter) {
    waiters.delete(tabId);
    waiter();
  }
};

browser.tabs.onActivated.addListener(async (activeInfo) => {
  // FIXME: supports only single window
  const allActiveFocus = await db.focus.filter((f) => f.active).toArray();
  const focusAtThisTab = await db.focus
    .where("tabId")
    .equals(activeInfo.tabId)
    .first();
  if (!focusAtThisTab) {
    log("no focus at active tabId " + activeInfo.tabId);
    return;
  }
  for (const f of allActiveFocus) {
    if (f.id !== focusAtThisTab.id) {
      await db.focus.update(f, { active: false });
    }
  }
  await db.focus.update(focusAtThisTab, { active: true });
});

let testCount = 0;
// タブに関するあらゆる更新情報が来る
// Duplicate&Newの際にフォーカス及びノードを正しく関連付けられるようにするため
// 特に、タブを複製した場合onCommitedは呼ばれずこっちのみが呼ばれる
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url) {
    throw new Error("tabs permission not granted?");
  }

  // ignore extension pages
  if (tab.url.startsWith("chrome-extension://")) {
    return;
  }

  if (changeInfo.url) {
    // URL変更(つまり遷移)が発生
    // 同じURLのリンク踏んでも発生しない!
    log(
      testCount++ +
        "th transition: " +
        JSON.stringify({ tabId, changeInfo, tab }, null, 2)
    );
    try {
      await processTransition({
        url: tab.url,
        tabId,
        openerTabId: tab.openerTabId,
      });
    } catch (e) {
      if (e instanceof Error) {
        log(e.stack);
      } else {
        log(e);
      }
    }

    //   const transitionInfo = await getTransitionInfo(tabId);
    // if(transitionInfo) {
    //   log("transitionInfo available")
    // }
  }
  // if (openedTabs.has(tabId)) return;
  // openedTabs.add(tabId);
  // 新規タブが作成された
  log("tabs.onUpdated: " + tabId);
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  // タブが閉じられた
  log("tabs.onRemoved: " + tabId);
  openedTabs.delete(tabId);
  const focus = await db.focus.where("tabId").equals(tabId).first();
  if (focus) {
    // focusが存在する場合削除
    ensureId(focus);
    await db.focus.delete(focus.id);
  } else {
    // 存在しない場合は本来の設計としておかしい
    log("tab closed but focus not found...?");
  }
});

browser.history.onVisited.addListener((r) => {
  // console.log("onVisited:");
  // console.log(r);
  // log("onVisited: " + JSON.stringify(r));
});
browser.history.onVisitRemoved.addListener((r) => {
  // console.log("onVisitedRemoved:");
  // console.log(r);
});
// I don't wanna save this to db
interface ExtendedVisitItem extends browser.History.VisitItem {
  url: string;
}
const processTransition = async (
  // r: browser.WebNavigation.OnCommittedDetailsType
  r: { url: string; tabId: number; openerTabId?: number }
) => {
  // ページが遷移した
  // 新しいタブの場合、tabs.onUpdatedを待つ
  // if(!openedTabs.has(r.tabId)) {
  //   await waitForTabInfo(r.tabId);
  // }
  log("processTransition, New/MoveTo " + r.url);

  // return;
  const focusAtThisTab = await db.focus.where("tabId").equals(r.tabId).first();
  const thisTabId = r.tabId;
  // const openerTabId = newlyOpenedTabsAndOpener.get(r.tabId);
  let newTab = false;
  log(openedTabs.has(r.tabId));
  if (!openedTabs.has(r.tabId)) {
    newTab = true;
    openedTabs.add(r.tabId);
  }
  // "他タブ要因によって""新しいタブ"が開かれた場合のみ元タブIDがセットされる
  let tabNewlyOpenedByTabId = newTab ? r.openerTabId : null;
  // force newtab to new tree
  if (r.url === "chrome://newtab/") {
    tabNewlyOpenedByTabId = null;
  }
  // 現在のフォーカス。タブが新しく開かれた場合、原因となったフォーカス。
  const openerTabFocus = tabNewlyOpenedByTabId
    ? await db.focus.where("tabId").equals(tabNewlyOpenedByTabId).first()
    : await db.focus.where("tabId").equals(thisTabId).first();
  log({
    focus: await db.focus.toArray(),
    newTab,
    tabNewlyOpenedByTabId,
    openerTabFocus,
    thisTabId,
  });
  if (!openerTabFocus) {
    log("this is independent tab, create new tree");
    // or tab is opened by another tab, ...
    // determine col number(absolute)
    const lastColNode = await db.node.orderBy("absolutePosition.col").last();
    const lastCol = lastColNode ? lastColNode.absolutePosition.col : -1;
    // determine absolutePosition
    const absolutePosition = { row: 0, col: lastCol + 1 };
    // create node at new tree
    const nodeId = await db.node.add({
      url: r.url,
      childrenIds: [],
      absolutePosition,
    });
    await db.focus.add({ tabId: r.tabId, nodeId, active:false });
  } else {
    if (tabNewlyOpenedByTabId !== thisTabId) {
      log("this is dependent tab");
    } else {
      log("this is on same tab");
    }
    // create or move?
    const openerNodeId = openerTabFocus.nodeId;
    const openerNode = await db.node.get(openerNodeId);
    if (!openerNode) {
      throw new Error("openerNode not found");
    }

    const children = await db.node.bulkGet(openerNode.childrenIds);
    if (!checkFullArray(children)) throw new Error("children has undefined");
    let moveToNode = (
      await Promise.all(
        children.map(async (child) => child?.url === r.url)
      ).then((bits) => children.filter(() => bits.shift()))
    )[0];

    // determine parent first? (perf)
    if (openerNode.parentId) {
      const parent = await db.node.get(openerNode.parentId);
      if (parent && parent.url === r.url) {
        moveToNode = parent;
      }
    }

    if (moveToNode) {
      // move!
      log("just move focus!");
      ensureId(moveToNode);
      if (newTab) {
        await db.focus.add({ nodeId: moveToNode.id, tabId: thisTabId, active:false });
      } else {
        await db.focus.update(openerTabFocus, { nodeId: moveToNode.id });
      }
    } else {
      // create and move focus!
      log("create and move focus!");
      // get new node position TODO: this is just for linear tree
      const targetPosAbs = {
        col: 0,
        row: 0,
      }; // just a place holder
      // 1a.if no child, let's just place row+1
      if (openerNode.childrenIds.length === 0) {
        targetPosAbs.col = openerNode.absolutePosition.col;
        targetPosAbs.row = openerNode.absolutePosition.row + 1;
      }
      // 1b.if has child(ren), let's place next(right) to it
      else {
        // find rightmost child
        // sort by col, DESC
        children.sort((a, b) => {
          return a.absolutePosition.col - b.absolutePosition.col;
        });
        const lastChild = children[children.length - 1];

        targetPosAbs.col = lastChild.absolutePosition.col + 1;
        targetPosAbs.row = lastChild.absolutePosition.row;
      }
      // 2.check if its placable(blank position). if not, insert new col
      // 窮屈にならないようにどうにかする?同一カラムに複数ツリーが存在しないようにする
      const nodeAtTargetPos = await db.node
        .where("[absolutePosition.col+absolutePosition.row]")
        .equals([targetPosAbs.col, targetPosAbs.row])
        .first();
      if (nodeAtTargetPos) {
        log("target pos non-blank, insert new col");
        // insert new col
        const allNodesToMove = await db.node
          .where("absolutePosition.col")
          .aboveOrEqual(targetPosAbs.col)
          .toArray();
        await Promise.all(
          allNodesToMove.map(async (n) => {
            await db.node.update(n, {
              absolutePosition: {
                col: n.absolutePosition.col + 1,
                row: n.absolutePosition.row,
              },
            });
          })
        );
        // move done
        // NOTE: must invalidate most of fetched node absolutePosition
      }
      const newNodeId = await db.node.add({
        url: r.url,
        parentId: openerNodeId,
        childrenIds: [],
        absolutePosition: targetPosAbs,
      });
      await db.node.update(openerNode, {
        childrenIds: [...openerNode.childrenIds, newNodeId],
      });
      if (newTab) {
        await db.focus.add({ nodeId: newNodeId, tabId: thisTabId, active:false });
      } else {
        if (!focusAtThisTab)
          throw new Error("trying to update focusAtThisTab but not found");
        await db.focus.update(focusAtThisTab, {
          nodeId: newNodeId,
        });
      }
    }
  }
};

browser.commands.onCommand.addListener(async (command) => {
  if (command === "open-view") {
    // get extension url
    const url = browser.runtime.getURL("/options/options.html");
    const viewTabs = await browser.tabs.query({ url });
    const viewTab = viewTabs.length > 0 ? viewTabs[0] : null;
    if (viewTab) {
      browser.tabs.update(viewTab.id, { active: true });
    } else {
      browser.tabs.create({ url });
    }
  } else {
    throw new Error("unknown command");
  }
});
