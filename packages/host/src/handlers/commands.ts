import browser from 'webextension-polyfill'
import { notifyUser } from '../background/utils'

export const handleCommands = (): void => {
  const { commands } = browser.runtime.getManifest()
  if (!commands) {
    throw new Error('invalid manifest')
  }

  browser.commands.onCommand.addListener((command) => {
    const description = commands[command]?.description ?? command
    ;(async (): Promise<void> => {
      if (command === 'open-view') {
        void notifyUser(`sorry, "${description}" is not implemented yet`)
      } else {
        void notifyUser(`sorry, "${description}" is not implemented yet`)
      }
    })().catch(console.error)
  })
}
