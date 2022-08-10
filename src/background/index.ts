import browser from "webextension-polyfill";
import { db, INode, INodeWithoutPosition } from "../db";
import { checkFullArray, ensureId, log } from "../utils";
import { handleTabEvents, openedTabs } from "./handlers/tabs";
import { handleHistoryEvents } from "./handlers/history";
import { handleCommands } from "./handlers/commands";
import { onMessage } from "webext-bridge";

onMessage("selectFocus", async ({ data }) => {
  // @ts-expect-error TODO: add data type
  const { focusId }: { focusId: number } = data;

  const focus = await db.focus.get(focusId);
  if (!focus) {
    throw new Error("focus not found");
  }

  // activate browser tab
  browser.tabs.update(focus.tabId, { active: true });
});

const optionUrl = browser.runtime.getURL("options/options.html");
// stays in tab
browser.tabs.create({ url: optionUrl }).then();
handleCommands();

const newlyOpenedTabsAndOpener = new Map<number, number>();
// key = tabId

handleTabEvents();
handleHistoryEvents();

// I don't wanna save this to db
interface ExtendedVisitItem extends browser.History.VisitItem {
  url: string;
}

// 既存タブのURL変更、または新しいタブ作成時に呼び出し
export const handleUrlChanged = async (
  // data: browser.WebNavigation.OnCommittedDetailsType
  data: { url: string; tabId: number; openerTabId?: number }
) => {
  // URLが遷移した
  log("handleUrlChanged, New/MoveTo " + data.url);

  const computeTransitionInfo = async () => {
    // 対象タブID
    const thisTabId = data.tabId;
    // URLが新しいタブで開かれたか？
    let isNewTab = false;
    if (!openedTabs.has(data.tabId)) {
      isNewTab = true;
      openedTabs.add(data.tabId);
    }
    console.assert(data.openerTabId !== thisTabId);

    // 「他タブ要因によって」「新しいタブが開かれた場合のみ」元タブIDがセットされる
    const openerTabId = isNewTab ? data.openerTabId : undefined;

    let shouldCreateNewTree = false;
    // force newtab to new tree
    if (data.url === "chrome://newtab/") {
      shouldCreateNewTree = true;
    }

    // 既存タブの場合、現在のフォーカス。新規タブの場合、原因となったフォーカス。
    const openerTabFocus = await db.focus
      .where("tabId")
      .equals(openerTabId ?? thisTabId)
      .first();
    if (!openerTabFocus) {
      console.info("expected focus for tab but got null, creating new tree");
      shouldCreateNewTree = true;
    }
    return {
      isNewTab: isNewTab,
      openerFocus: shouldCreateNewTree ? null : openerTabFocus,
      tabId: thisTabId,
    };
  };
  const transition = await computeTransitionInfo();

  if (!transition.openerFocus) {
    log("this is independent tab, create new tree");
    // or tab is opened by another tab, ...
    // determine col number(absolute)
    const lastColNode = await db.node.orderBy("absolutePosition.col").last();
    const lastCol = lastColNode ? lastColNode.absolutePosition.col : -1;
    // determine absolutePosition
    const absolutePosition = { row: 0, col: lastCol + 1 };
    // create node at new tree
    const nodeId = await db.node.add({
      url: data.url,
      childrenIds: [],
      absolutePosition,
    });
    await db.focus.add({ tabId: data.tabId, nodeId, active: false });
  } else {
    // create or move?
    const openerFocusNodeId = transition.openerFocus.nodeId;
    const openerFocusNode = await db.node.get(openerFocusNodeId);
    if (!openerFocusNode) {
      throw new Error("openerNode not found");
    }

    // childrenから遷移先nodeの探索を試す
    const openerNodeChildren = await db.node.bulkGet(
      openerFocusNode.childrenIds
    );
    if (!checkFullArray(openerNodeChildren))
      throw new Error("children has undefined");
    // openerNodeChildrenの中で、変更後URLと同じURLがセットされているものを探す。
    const childNodeMoveTo = (
      await Promise.all(
        openerNodeChildren.map(async (child) => child?.url === data.url)
      ).then((bits) => openerNodeChildren.filter(() => bits.shift()))
    )[0];

    // 逆に、parentは遷移先nodeとなり得るか調べる
    let parentNodeMoveTo: INode | null = null;
    if (openerFocusNode.parentId) {
      const parent = await db.node.get(openerFocusNode.parentId);
      if (parent && parent.url === data.url) {
        parentNodeMoveTo = parent;
      }
    }

    // ひとまず親ノードを優先
    // 遷移先ノード、または無ければnull。
    const nodeMoveTo = parentNodeMoveTo
      ? parentNodeMoveTo
      : childNodeMoveTo
      ? childNodeMoveTo
      : null;

    if (nodeMoveTo) {
      // フォーカス追加or移動のみ
      // move!
      log("just move focus!");
      ensureId(nodeMoveTo);
      if (transition.isNewTab) {
        // タブが複製された
        await db.focus.add({
          nodeId: nodeMoveTo.id,
          tabId: transition.tabId,
          active: false,
        });
      } else {
        // 既存のタブでリンク遷移（元のページに戻る/進む）
        await db.focus.update(transition.openerFocus, {
          nodeId: nodeMoveTo.id,
        });
      }
    } else {
      // 既存のツリーにノード追加、フォーカス追加or移動
      log("create and move focus!");

      const newNode = await createNode(
        { url: data.url, parentId: openerFocusNodeId, childrenIds: [] },
        openerFocusNode,
        openerNodeChildren
      );

      if (transition.isNewTab) {
        // 「新しいタブで開く」
        await db.focus.add({
          nodeId: newNode.id,
          tabId: transition.tabId,
          active: false,
        });
      } else {
        // 既存のタブでリンク遷移
        await db.focus.update(transition.openerFocus, {
          nodeId: newNode.id,
        });
      }
    }
  }
};

const createNode = async (
  nodeData: INodeWithoutPosition,
  parentNode: INode,
  parentNodeChildren: INode[]
) => {
  // get new node position
  const targetPosAbs = {
    col: 0,
    row: 0,
  }; // just a place holder
  // 1a.if no child, let's just place row+1
  if (parentNode.childrenIds.length === 0) {
    targetPosAbs.col = parentNode.absolutePosition.col;
    targetPosAbs.row = parentNode.absolutePosition.row + 1;
  }
  // 1b.if has child(ren), let's place next(right) to it
  else {
    // find rightmost child
    // sort by col, DESC
    parentNodeChildren.sort((a, b) => {
      return a.absolutePosition.col - b.absolutePosition.col;
    });
    const lastChild = parentNodeChildren[parentNodeChildren.length - 1];

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

  const newNode = {
    ...nodeData,
    absolutePosition: targetPosAbs,
  };

  const newNodeId = await db.node.add(newNode);
  await db.node.update(parentNode, {
    childrenIds: [...parentNode.childrenIds, newNodeId],
  });
  return { id: newNodeId, ...newNode };
};
