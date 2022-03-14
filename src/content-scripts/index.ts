import { sendMessage } from "webext-bridge";

alert("hello from contente-script!");
console.log("hello from contente-script!");
sendMessage(
  "ping",
  { mesasge: `Ping from ${document.title} to background!` },
  "background"
);
