import { expect, test } from './fixtures'

test('popup page shows', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/index.html`)
  await expect(page.locator('body')).toContainText('React')
})

test('command not found error shows', async ({ page }) => {
  test.skip(!!process.env.CI)
  // Press Alt + Q and expect error notification
  await page.pause()
})
