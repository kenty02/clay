import { registerCommandHandlers } from './background/commands'
import { connectNativeRelay } from './trpc/wsServer'
import { enableDebug, getTestOptions } from './debug'
import { startStrategy } from './core/strategy'

if (import.meta.env.DEV) enableDebug()
registerCommandHandlers()

void startStrategy()

if (import.meta.env.DEV) {
  getTestOptions().then(({ sendResponse }) => {
    connectNativeRelay().then((port) => {
      sendResponse({ port })
    })
  })
} else {
  void connectNativeRelay()
}
