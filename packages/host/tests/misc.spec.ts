import { expect, test } from './fixtures'

test('popup page shows', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/index.html`)
  await expect(page.locator('body')).toContainText('React')
})

test('command not found error shows', async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!!process.env.CI)
  // Press Alt + Q and expect error notification
  // eslint-disable-next-line playwright/no-page-pause
  await page.pause()
})
