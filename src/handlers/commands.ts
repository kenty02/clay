import browser from "webextension-polyfill";
import {notifyUser} from "../background/utils";

export const handleCommands = () => {
  browser.commands.onCommand.addListener((command) => {
    (async () => {
      if (command === "open-view") {
        void notifyUser(`sorry, "${command}" is not implemented yet`);
      } else {
        void notifyUser(`sorry, "${command}" is not implemented yet`);
      }
    })().catch(console.error);
  });
};
