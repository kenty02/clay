import { registerCommandHandlers } from './background/commands'
import { connectNativeRelay } from './trpc/wsServer'
import { enableDebug, getTestOptions } from './debug'
import { startStrategy } from './core/strategy'

if (import.meta.env.DEV) enableDebug()
registerCommandHandlers()

void startStrategy()

// viteが既に起動している(& --mode testが指定されなかった)状態でテストがされた場合は必ずfalseになる(CIではreuseExistingServerがfalseなので気にしなくていい)
const isTesting = import.meta.env.DEV && import.meta.env.MODE === 'test'
if (isTesting) {
  getTestOptions().then(({ sendResponse }) => {
    connectNativeRelay(isTesting).then((port) => {
      sendResponse({ port })
    })
  })
} else {
  void connectNativeRelay()
}
