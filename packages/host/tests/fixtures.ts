import { type BrowserContext, chromium, Page, test as base } from '@playwright/test'
import * as path from 'path'
import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client'
import { AppRouter } from '../src/trpc/router'
import { WebSocket } from 'ws'
import superjson from 'superjson'
import { ChildProcess, exec } from 'child_process'
// @ts-ignore no problem with playwright tsconfig
import detect_port from 'detect-port'
import { surfingScenarios } from './surfingScenarios'
import { TestOptions } from '../src/debug'

const isVite = true
export const test = base.extend<{
  _disableSnapshotPlatformSuffix: void
  relayPort: number
  context: BrowserContext
  extensionId: string
  client: ReturnType<typeof createTRPCProxyClient<AppRouter>>
  startSite: (siteName: string) => Promise<string>
  waitForManualAction: <T>(promise: Promise<T>, page?: Page) => Promise<T>
  doSurfing: (surfName: keyof typeof surfingScenarios) => Promise<void>
}>({
  _disableSnapshotPlatformSuffix: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo): Promise<void> => {
      testInfo.snapshotSuffix = ''
      await use()
    },
    { auto: true }
  ],
  // eslint-disable-next-line no-empty-pattern
  relayPort: async ({}, use): Promise<void> => {
    const relayPort = await detect_port(4000)
    console.log('using port ' + relayPort)
    await use(relayPort)
  },
  context: async ({ browserName, relayPort }, use) => {
    if (browserName !== 'chromium') {
      throw new Error('only chromium is supported for now')
    }
    const pathToExtension = path.join(process.cwd(), isVite ? 'dist' : 'dist-prod')
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    })

    if (isVite) {
      const page = await context.newPage()

      let [background] = context.serviceWorkers()
      if (!background) background = await context.waitForEvent('serviceworker')
      const extensionId = background.url().split('/')[2]
      const testOptions: TestOptions = {
        type: 'testOptions',
        relayPort
      }
      await page.evaluate(
        `chrome.runtime.sendMessage('${extensionId}', ${JSON.stringify(testOptions)})`
      )

      // wait for playWriteReady() to close this as a ready signal
      // todo fix this takes ~1.9s
      await page.waitForEvent('close')
    }

    await use(context)
    await context.close()
  },
  page: async ({ context, page: originalPage }, use) => {
    void originalPage
    // somehow fixes strange "tabs.onActivated not emitting" bug (working in real browser)
    const page = await context.newPage()
    await use(page)
  },
  extensionId: async ({ context }, use) => {
    /*
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background)
      background = await context.waitForEvent('backgroundpage')
    */

    // for manifest v3:
    let [background] = context.serviceWorkers()
    if (!background) background = await context.waitForEvent('serviceworker')

    const extensionId = background.url().split('/')[2]
    await use(extensionId)
  },
  client: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ context, relayPort }, use, testInfo): Promise<void> => {
      const wsClient = createWSClient({
        url: `ws://localhost:${relayPort}/ws`,
        // @ts-ignore seems working
        WebSocket
      })
      const client = createTRPCProxyClient<AppRouter>({
        links: [
          wsLink({
            client: wsClient
          })
        ],
        transformer: superjson
      })
      // listen and attach log
      const logs = []
      const errorLogs = []
      client.debug.onLog.subscribe(undefined, {
        onData: (log) => {
          if (typeof log === 'object' && 'error' in log) {
            errorLogs.push(log)
          } else {
            logs.push(log)
          }
        }
      })
      // check actually works
      await expect(client.hello.query('playwright')).resolves.toBe('hello playwright')
      await use(client)
      await testInfo.attach('debug-log.json', {
        body: JSON.stringify(logs, null, 2),
        contentType: 'application/json'
      })
      expect(errorLogs).toEqual([])
    },
    // to capture errors //fixme wakes up too early when auto: true?
    { auto: false }
  ],
  startSite: async ({ request }, use) => {
    const processes: ChildProcess[] = []
    await use(async (siteName): Promise<string> => {
      if (siteName !== 'letsencrypt') throw new Error('only letsencrypt is supported')
      const port = 1313
      const url = `http://localhost:${port}`

      const isPortUsed = await detect_port(port)
        .then((returned) => returned !== port)
        .catch(() => true)

      if (!isPortUsed) {
        const siteLocalPath = process.env.SITE_LOCAL_PATH
        if (!siteLocalPath) {
          throw new Error('Please set SITE_LOCAL_PATH or start `hugo server`')
        }
        processes.push(
          exec(`hugo server --port ${port}`, { cwd: siteLocalPath }, (err) => {
            if (err instanceof Error) {
              throw err
            }
          })
        )
        if (!process.env.CI) {
          console.log('(startSite) start `hugo server` (in site directory) for faster tests!')
        }
      }
      // ensure site is up before test
      const response2 = await request.head(url)
      await expect(response2).toBeOK()

      return url
    })
    processes.forEach((proc) => proc.kill())
  },
  waitForManualAction: async ({ page: defaultPage }, use) => {
    await use(async <T>(promise: Promise<T>, page: Page = defaultPage): Promise<T> => {
      const pagePausePromise = page.pause()
      const promiseResult = await promise
      await page.evaluate('playwright.resume()')
      await pagePausePromise
      return promiseResult
    })
  },
  doSurfing: async ({ page, context, startSite }, use) => {
    void page
    await use(async (surfName): Promise<void> => {
      await surfingScenarios[surfName]({ page, context, startSite })
    })
  }
})
export const expect = test.expect
