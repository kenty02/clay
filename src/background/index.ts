import browser from "webextension-polyfill";
import { onMessage } from "webext-bridge";
import { db, IFocus } from "../db";
import { checkFullArray, log } from "../utils";

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

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // const a = { tabId, changeInfo, tab };
  // log("onUpdated: " + JSON.stringify(a, null, 2));
  log("-".repeat(10));
  if (openedTabs.has(tabId)) return;
  openedTabs.add(tabId);
  // we can get opener from tab info
  // but it may be not precise. alternatively, analyse transition, analyse onclicks, or hijack webrequest?
  tab.openerTabId && newlyOpenedTabsAndOpener.set(tabId, tab.openerTabId);
  if (tab.openerTabId) {
    // tab opened by another tab, by clicking link or duplication
    log(`tab ${tab.id} opened by tab ${tab.openerTabId}`);
    const openerTab = await browser.tabs.get(tab.openerTabId);
    if (tab.url === openerTab.url) {
      // on duplicated, onCommited WON'T be called (tabs.onUpdated only)
      // how to detect duplicated? this function is called first
      // 1. duplicate at all cases(done) and delete later at onCommited
      log(`tab ${tab.id} is duplicated or clicked same url`);
      const focusAtOpenerTab = await db.focus
        .where("tabId")
        .equals(tab.openerTabId)
        .first();
      if (!focusAtOpenerTab) throw new Error("no focus at opener tab");
      await db.focus.add({
        ...focusAtOpenerTab,
        id: undefined,
        tabId,
      });
    } else {
      // by link?
      const focusAtOpenerTab = await db.focus
        .where("tabId")
        .equals(tab.openerTabId)
        .first();
      if (!focusAtOpenerTab) throw new Error("no focus at opener tab");
      await db.focus.add({
        ...focusAtOpenerTab,
        id: undefined,
        tabId,
      });
      log(`tab ${tab.id} is opened by link`);
    }
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

// these are for bfDetect
const extendedVisitItemCache = new Map<string, ExtendedVisitItem>();
let preFocused = "-1";

// browser.history.onTitleChanged.addListener(console.log);
browser.webNavigation.onCommitted.addListener(async (r) => {
  const visits = await browser.history.getVisits({
    url: r.url,
  });
  // sort visits by visitId, DESC
  visits.sort((a, b) => {
    // caveat: visitId might not be integer
    return parseInt(b.visitId) - parseInt(a.visitId);
  });
  // cache all visits for bfDetect
  for (const v of visits) {
    extendedVisitItemCache.set(v.visitId, { url: r.url, ...v });
  }
  // transition happened!
  if (
    r.transitionType == "link" ||
    r.transitionType == "form_submit" ||
    r.transitionType == "generated"
  ) {
    log("=".repeat(10));
    log("onCommited:");
    // log(r);
    // log(visits.length);

    // NOTE: this won't work for onHistoryStateUpdated (on chrome?)
    // bfDetect
    const lastVisit = visits[0];
    // log("Last visit:");
    // log(lastVisit ?? "Not Found!!");

    // log("Refering (extended)Visit of last visit:");
    // const referingVisit = extendedVisitItemCache.get(
    //   lastVisit.referringVisitId
    // );
    // log(referingVisit ?? "Not Found!!");
    // if (referingVisit) {
    //   log("More Refering (extended)Visit of last visit:");
    //   log(extendedVisitItemCache.get(referingVisit.visitId) ?? "Not Found!!");
    // }
    // if (r.transitionQualifiers.includes("forward_back")) {
    //   log("foward_back detected:");
    //   if (referingVisit == null) {
    //     log("back? (referingVisit null)");
    //   } else {
    //     if (preFocused === referingVisit.visitId) {
    //       log("forward? (referingVisit same as preFocused)");
    //     } else {
    //       log("back?");
    //     }
    //   }
    // }

    // log("...and its historyitem");
    // we can't get historyItem by id :(

    preFocused = lastVisit.visitId;

    try {
      await processTransition(r);
    } catch (e) {
      if (e instanceof Error) {
        log(e.message);
      } else {
        log(e);
      }
    }
  }
});

const getFocus = async () => {
  // const focused = await browser.windows.getLastFocused();
};

const processTransition = async (
  r: browser.WebNavigation.OnCommittedDetailsType
) => {
  log("New/MoveTo " + r.url);
  const focusAtThisTab = await db.focus.where("tabId").equals(r.tabId).first();
  const openerTabId = newlyOpenedTabsAndOpener.get(r.tabId);
  if (!focusAtThisTab && !openerTabId) {
    log("focusAtTab and opener not found, create new tree");
    // or tab is opened by another tab, ...
    // determine col number(absolute)
    const lastColNode = await db.node.orderBy("absolutePosition.col").last();
    if (!lastColNode) {
      throw new Error("no node!!");
    }
    const lastCol = lastColNode.absolutePosition.col;
    // determine absolutePosition
    const absolutePosition = { row: 0, col: lastCol + 1 };
    // create node at new tree
    const nodeId = await db.node.add({
      url: r.url,
      childrenIds: [],
      absolutePosition,
    });
    await db.focus.add({ tabId: r.tabId, nodeId });
  } else {
    let currentFocus: IFocus;
    if (focusAtThisTab && !newlyOpenedTabsAndOpener.get(r.tabId)) {
      log("focusAtTab found");
      currentFocus = focusAtThisTab;
    } else if (openerTabId) {
      const focusAtOpenerTab = await db.focus
        .where("tabId")
        .equals(openerTabId)
        .first();
      if (!focusAtOpenerTab) {
        throw new Error("focusAtOpenerTab not found! maybe create new tree?");
      }
      log("focusAtTab not found but opener found");
      currentFocus = focusAtOpenerTab;
    } else {
      throw new Error("something is wrong (condition mismatch)");
    }

    // create or move?
    const nodeId = currentFocus.nodeId;
    const node = await db.node.get(nodeId);
    if (!node) {
      throw new Error("node specified at currentFocus was missing");
    }

    const children = await db.node.bulkGet(node.childrenIds);
    if (!checkFullArray(children)) throw new Error("children has undefined");
    let moveToNode = (
      await Promise.all(
        children.map(async (child) => child?.url === r.url)
      ).then((bits) => children.filter(() => bits.shift()))
    )[0];

    // determine parent first? (perf)
    if (node.parentId) {
      const parent = await db.node.get(node.parentId);
      if (parent && parent.url === r.url) {
        moveToNode = parent;
      }
    }

    if (moveToNode) {
      // move!
      log("just move focus!");
      await db.focus.update(currentFocus, { nodeId: moveToNode.id });
    } else {
      // create and move focus!
      log("create and move focus!");
      // get new node position TODO: this is just for linear tree
      const targetPosAbs = {
        col: 0,
        row: 0,
      }; // just a place holder
      // 1a.if no child, let's just place row+1
      if (node.childrenIds.length === 0) {
        targetPosAbs.col = node.absolutePosition.col;
        targetPosAbs.row = node.absolutePosition.row + 1;
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
        parentId: nodeId,
        childrenIds: [],
        absolutePosition: targetPosAbs,
      });
      await db.node.update(node, {
        childrenIds: [...node.childrenIds, newNodeId],
      });
      if (!focusAtThisTab) throw new Error("focusAtThisTab not found");
      await db.focus.update(focusAtThisTab, {
        nodeId: newNodeId,
      });
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
