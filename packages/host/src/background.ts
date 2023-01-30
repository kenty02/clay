import { registerCommandHandlers } from './background/commands'
import { connectNativeRelay } from './trpc/wsServer'
import { enableDebug, getTestOptions, playWrightReady } from './debug'
import { startStrategy } from './core/strategy'

if (import.meta.env.DEV) enableDebug()
registerCommandHandlers()

void startStrategy()

if (import.meta.env.DEV) {
  getTestOptions().then((testOptions) => {
    connectNativeRelay(testOptions.relayPort).then(() => {
      playWrightReady()
    })
  })
} else {
  void connectNativeRelay(3003)
}
