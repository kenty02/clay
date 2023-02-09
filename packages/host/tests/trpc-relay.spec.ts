import { expect, test } from './fixtures'

test('10KB hello request/response ok', async ({ client }) => {
  const request = 'a'.repeat(10 * 1024)
  const expectedResponse = `hello ${request}`
  const query = client.hello.query(request)
  await expect(query).resolves.toBe(expectedResponse)
})
test(`1MB hello request/response fails`, async ({ client }) => {
  const request = 'a'.repeat(1024 * 1024)
  const query = client.hello.query(request)
  await expect(query).rejects.not.toBeUndefined()
})
test('500KB x 1000 serial hello request/response ok', async ({ client }) => {
  // too heavy for CI
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!!process.env.CI)

  const request = 'a'.repeat(500 * 1024)
  const expectedResponse = `hello ${request}`
  for (let i = 0; i < 1000; i++) {
    const response = await client.hello.query(request)

    // eslint-disable-next-line playwright/no-conditional-in-test
    if (response !== expectedResponse) {
      throw new Error(`Unexpected response: ${response}`)
    }
  }
  // you can check there are no memory leak manually
  // await page.pause()
})
