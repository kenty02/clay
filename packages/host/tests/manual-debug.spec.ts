import { test } from './fixtures'

test('manual test', async ({ page }) => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!!process.env.CI)
  // eslint-disable-next-line playwright/no-page-pause
  await page.pause()
})
