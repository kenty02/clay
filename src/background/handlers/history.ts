import browser from "webextension-polyfill";
import {logJson} from "../../utils";

export const handleHistoryEvents = () => {
    browser.history.onVisited.addListener((r) => {
        // console.log("onVisited:");
        // console.log(r);
        // log("onVisited: " + JSON.stringify(r));
        logJson(JSON.stringify({type:"history.onVisited", ...r}))
    });
    browser.history.onVisitRemoved.addListener((r) => {
        // console.log("onVisitedRemoved:");
        // console.log(r);
        logJson(JSON.stringify({type:"history.onVisitRemoved", ...r}))
    });
}
