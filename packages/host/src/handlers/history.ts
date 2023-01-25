import browser from 'webextension-polyfill'
import {log} from "../log";

export const handleHistoryEvents = () => {
  browser.history.onVisited.addListener((r) => {
    // console.log("onVisited:");
    // console.log(r);
    // log("onVisited: " + JSON.stringify(r));
    log(JSON.stringify({ type: 'history.onVisited', ...r }))
  })
  browser.history.onVisitRemoved.addListener((r) => {
    // console.log("onVisitedRemoved:");
    // console.log(r);
    log(JSON.stringify({ type: 'history.onVisitRemoved', ...r }))
  })
}
