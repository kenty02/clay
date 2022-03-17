import { sendMessage } from "webext-bridge";

alert("hello from content-script!");
console.log("hello from content-script!");
sendMessage(
  "ping",
  { pongMessage: `Pong from ${document.title} to background!` },
  "background"
);
