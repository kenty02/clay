import browser from "webextension-polyfill";
import { onMessage } from "webext-bridge";

const optionUrl = browser.runtime.getURL("options/options.html");
browser.tabs.create({ url: optionUrl });
console.log("hello world!");

onMessage("ping", ({ data: { pongMessage }, ...rest }) => {
  rest.sender;
  console.log("Got Pong!");
  console.log(pongMessage);
  return;
});

export const getPing = () => {
  return "Ping!";
};
