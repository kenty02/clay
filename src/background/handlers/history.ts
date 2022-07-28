import browser from "webextension-polyfill";

export const handleHistoryEvents = () => {
    browser.history.onVisited.addListener((r) => {
        // console.log("onVisited:");
        // console.log(r);
        // log("onVisited: " + JSON.stringify(r));
    });
    browser.history.onVisitRemoved.addListener((r) => {
        // console.log("onVisitedRemoved:");
        // console.log(r);
    });
}
