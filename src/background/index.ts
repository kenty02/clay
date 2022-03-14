import browser from "webextension-polyfill";
import { onMessage } from "webext-bridge";

const optionUrl = browser.runtime.getURL("options/options.html");
browser.tabs.create({ url: optionUrl });
console.log("hello world!");

onMessage("ping", ({ data }) => {
  console.log("Got Ping!");
  console.log(data);
  return;
});
