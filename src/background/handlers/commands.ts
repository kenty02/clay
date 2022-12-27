import browser from "webextension-polyfill";

export const handleCommands = () => {
  browser.commands.onCommand.addListener((command) => {
    (async () => {
      if (command === "open-view") {
        // get extension url
        const url = browser.runtime.getURL("/view/view.html");
        const viewTabs = await browser.tabs.query({ url });
        const viewTab = viewTabs.length > 0 ? viewTabs[0] : null;
        if (viewTab) {
          await browser.tabs.update(viewTab.id, { active: true });
        } else {
          await browser.tabs.create({ url });
        }
      } else {
        throw new Error("unknown command");
      }
    })().catch(console.error);
  });
};
