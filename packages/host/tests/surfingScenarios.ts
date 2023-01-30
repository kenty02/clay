import type { BrowserContext, Page } from '@playwright/test'

const bringToFrontCoolDown = 100
export const surfingScenarios = {
  "Let's Encrypt 2 focuses": async ({ page, context, startSite }): Promise<void> => {
    const url = await startSite('letsencrypt')

    await page.goto(url)
    await page.getByRole('link', { name: 'Get Started' }).click()
    const page2Promise = context.waitForEvent('page')
    await page.getByRole('menuitem', { name: 'Documentation' }).click({ button: 'middle' })
    const page2 = await page2Promise
    // this value seems safe (at least in my machine)
    await page2.bringToFront()
    await page2.waitForTimeout(bringToFrontCoolDown)
    await page.bringToFront()
    await page.waitForTimeout(bringToFrontCoolDown)
  }
} satisfies Record<
  string,
  (opts: {
    page: Page
    context: BrowserContext
    startSite: (siteName: string) => Promise<string>
  }) => Promise<void>
>
