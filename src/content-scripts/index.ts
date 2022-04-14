import { sendMessage } from "webext-bridge";

// alert("hello from content-script!");
// console.log("hello from content-script!");
sendMessage(
  "ping",
  { pongMessage: `Pong from ${document.title} to background!` },
  "background"
);

// get canoical url
const canoURL = document
  .querySelector('link[rel="canonical"]')
  ?.getAttribute("href");
if (!canoURL) {
  // alert("no canonical url found");
} else {
  console.log(`canoURL: ${canoURL}`);
}
const realURL = document.location.href;
