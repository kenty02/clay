// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck rewrite later
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import type { Server as WebSocketServer, WebSocket } from 'ws'
import { appRouter } from './router'
import { createContext } from './context'
import type { IncomingMessage } from 'http'
import { EventEmitter } from 'events'
import browser from 'webextension-polyfill'
import { notifyUser } from '../background/utils'
import { log, logError } from '../log'

// 事前条件
// - クライアントは常に1度しか来ない（relay側でブロックするため)
class NotImplementedError extends Error {
  constructor(message = 'not specified') {
    super('Not implemented: ' + message)
  }
}

let isConnected = false

let cee: EventEmitter | null = null
let connectionCb: ((ws: WebSocket, req: IncomingMessage) => void) | null = null

function createConnection(): WebSocket {
  if (cee !== null) {
    log('cee not null')
    return null
  }
  log('createConnection')
  cee = new EventEmitter()
  const ee = cee
  const fakeWebSocket = {
    OPEN: 1,
    send: (data: string): void => {
      portPostMessage?.(data)
    },
    readyState: 1, // already OPEN
    on(event: string, cb: (this: WebSocket, ...args: never[]) => void): WebSocket {
      if (event === 'message') {
        // @ts-ignore rewrite later
        ee.on('message', cb)
      } else if (event === 'error') {
        /*
                                  const error = new Error("error here"); // todo
                                  cb(fakeWebSocket, error);
                        */
        ee.on('error', cb)
      } else throw new NotImplementedError()
      return fakeWebSocket
    },
    once(event: string, cb: (this: WebSocket, ...args: never[]) => void): WebSocket {
      if (event === 'close') {
        // @ts-ignore rewrite later
        ee.once('close', cb)
      } else throw new NotImplementedError()
      return fakeWebSocket
    }
  }
  // @ts-ignore rewrite later
  connectionCb?.(fakeWebSocket, /*IncomingMessage*/ null)
  return () => {
    ee.emit('close')
    fakeWebSocket.readyState = 3 // CLOSED (or CLOSING?)
    if (cee === ee) cee = null
  }
}

const wss: WebSocketServer = {
  // @ts-expect-error not implemented
  options: null,
  clients: new Set<WebSocket>(),
  on(
    event: 'connection' | 'message' | string | symbol,
    cb:
      | ((this: WebSocketServer<WebSocket>, socket: WebSocket, request: IncomingMessage) => void)
      | ((this: WebSocketServer<WebSocket>, ...args: never[]) => void)
  ): WebSocketServer {
    if (event !== 'connection') {
      throw new NotImplementedError(event.toString())
    }
    // must invoke after connect
    connectionCb = cb
    return wss
  },
  close: () => {
    // todo close on createcontext error
  }
}
// noinspection TypeScriptValidateTypes
applyWSSHandler({ wss, router: appRouter, createContext })

// ws.once("close... not implemented
/*
wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});
*/

/* todo something relevant
process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
*/
let disposeConnection: (() => void) | null = null
let portPostMessage: ((message: string) => void) | null = null

export const connectNativeRelay = (isTesting = false): Promise<number> => {
  return new Promise((resolve) => {
    const nativePort = browser.runtime.connectNative('net.hu2ty.clay_relay')
    const tags: string[] = []
    if (import.meta.env.DEV) tags.push('dev')
    if (isTesting) tags.push('test')
    const initialMessage = { tags }
    nativePort.postMessage(initialMessage)

    nativePort.onMessage.addListener(handleMessage)
    portPostMessage = (message): void => {
      nativePort.postMessage(JSON.parse(message)) // object -> string -> object -> stringを何故かやっている
    }

    let relayValidated = false

    function handleMessage(message: unknown): void {
      // @ts-expect-error aaaa
      const relayMessage = message.relayMessage // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      if (!relayValidated) {
        if (typeof relayMessage === 'string') {
          const match = relayMessage.match(/^This is clay-relay at port (\d+)$/)
          if (match) {
            const port = Number(match[1])
            relayValidated = true
            resolve(port)
          } else {
            logError('Invalid relay message: ' + relayMessage)
          }
        }
        return
      }
      if (typeof relayMessage === 'string') {
        if (relayMessage === 'open') {
          log('Connected to viewer')
          void notifyUser('Viewer connected')
          isConnected = true
          disposeConnection = createConnection()
        } else if (relayMessage === 'close') {
          if (!isConnected) return
          log('Disconnected from viewer')
          void notifyUser('Viewer disconnected')
          isConnected = false

          disposeConnection?.()
          disposeConnection = null
        } else {
          log(`Unknown relay message ${relayMessage}`)
        }
        return
      }
      cee?.emit('message', JSON.stringify(message)) // json -> string -> jsonとしてて最悪
    }

    nativePort.onDisconnect.addListener(handleDisconnect)

    function handleDisconnect(): void {
      log('Disconnected from relay!')
      log(nativePort.error)
      void notifyUser('Disconnected from relay! ')
      isConnected = false
    }

    return () => {
      nativePort.disconnect()
      nativePort.onMessage.removeListener(handleMessage)
      nativePort.onDisconnect.removeListener(handleDisconnect)
      portPostMessage = null
    }
  })
}
