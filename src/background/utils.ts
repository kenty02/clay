import browser from "webextension-polyfill";

export function notifyUser(message: string) {
  return browser.notifications.create({
    type: "basic",
    title: "Clay",
    message,
    iconUrl: browser.runtime.getURL("icon-32.png"),
  });
}