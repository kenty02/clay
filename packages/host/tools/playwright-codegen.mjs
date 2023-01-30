import {chromium} from '@playwright/test'
import path from 'path';

(async () => {
  const pathToExtension = path.join(process.cwd(), 'dist')
  const userDataDir = path.join(process.cwd(), 'test-chrome-user-data')
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`]
  })
  let [background] = browserContext.serviceWorkers()
  if (!background) background = await browserContext.waitForEvent('serviceworker')

  // Pause the page, and start recording manually.
  const page = await browserContext.newPage()
  await page.pause()
})()
