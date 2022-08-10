import browser from "webextension-polyfill";

export const handleCommands = () => {
    browser.commands.onCommand.addListener(async (command) => {
        if (command === "open-view") {
            // get extension url
            const url = browser.runtime.getURL("/options/options.html");
            const viewTabs = await browser.tabs.query({url});
            const viewTab = viewTabs.length > 0 ? viewTabs[0] : null;
            if (viewTab) {
                browser.tabs.update(viewTab.id, {active: true});
            } else {
                browser.tabs.create({url});
            }
        } else {
            throw new Error("unknown command");
        }
    });
}
