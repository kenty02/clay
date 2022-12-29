import browser from "webextension-polyfill";
import { log } from "../utils";
import {
  disposeHandlers,
  getMessageHandler,
  setConnected,
} from "clay-rpc-server";
import { ClientMessage } from "./core/messageTypes";

export function connectNativeRelay() {
  const port = browser.runtime.connectNative("net.hu2ty.clay_relay");
  port.onMessage.addListener(handleMessage);

  const handleClientMessage = getMessageHandler((data) => {
    port.postMessage(data);
  });

  let relayValidated = false;

  function handleMessage(message: unknown) {
    log(message);
    // @ts-expect-error aaaa
    const relayStatus = message.relayStatus; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
    if (!relayValidated) {
      if (typeof relayStatus === "string") {
        if (relayStatus === "This is clay-relay") {
          relayValidated = true;
        }
      }
      return;
    }
    if (typeof relayStatus === "string") {
      if (relayStatus === "open") {
        log("Connected to server");
        setConnected(true);
      } else if (relayStatus === "close") {
        log("Disconnected from server");
        setConnected(false);
        disposeHandlers();
      } else {
        log(`Unknown relay status ${relayStatus}`);
      }
      return;
    }
    void handleClientMessage(message as ClientMessage);
  }

  port.onDisconnect.addListener(handleDisconnect);

  function handleDisconnect() {
    log("Disconnected from relay!");
    log(port.error);
    setConnected(false);
    disposeHandlers();
  }

  return () => {
    port.disconnect();
    port.onMessage.removeListener(handleMessage);
    port.onDisconnect.removeListener(handleDisconnect);
  };
}
