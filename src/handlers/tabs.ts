import browser from "webextension-polyfill";
import {db} from "../db"
import {ensureId, log} from "../utils";
import {handleUrlChanged, notifyFocusUpdate} from "../background";

export const openedTabs = new Set<number>();
export const handleTabEvents = () => {
  browser.tabs.onActivated.addListener((activeInfo) => {
    (async () => {
      log(JSON.stringify({type: "tabs.onActivated", ...activeInfo}));
      // FIXME: supports only single window
      const allActiveFocus = await db.focus.filter((f) => f.active).toArray();
      const focusAtThisTab = await db.focus
          .where("tabId")
        .equals(activeInfo.tabId)
        .first();
      if (!focusAtThisTab) {
        log(`no focus at active tabId ${activeInfo.tabId}`);
        return;
      }
      for (const f of allActiveFocus) {
        if (f.id !== focusAtThisTab.id) {
          await db.focus.update(f, { active: false });
          notifyFocusUpdate({ ...f, active: false });
        }
      }
      await db.focus.update(focusAtThisTab, { active: true });
      notifyFocusUpdate({ ...focusAtThisTab, active: true });
    })().catch(console.error);
  });

  let testCount = 0;
  // タブに関するあらゆる更新情報が来る
  // Duplicate&Newの際にフォーカス及びノードを正しく関連付けられるようにするため
  // 特に、タブを複製した場合onCommitedは呼ばれずこっちのみが呼ばれる
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    (async () => {
      log(
          JSON.stringify({type: "tabs.onUpdated", tabId, changeInfo, tab})
      );
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
          `${testCount++}th transition: ${JSON.stringify(
            { tabId, changeInfo, tab },
            null,
            2
          )}`
        );
        try {
          await handleUrlChanged({
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
      log(`tabs.onUpdated: ${tabId}`);
    })().catch(console.error);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    (async () => {
      log(JSON.stringify({type: "tabs.onRemoved", tabId}));
      // タブが閉じられた
      log(`tabs.onRemoved: ${tabId}`);
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
    })().catch(console.error);
  });
};
