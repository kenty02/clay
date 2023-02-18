import { createTRPCProxyClient } from '@trpc/client'
import { chromeLink } from 'trpc-chrome/link'
import type { ChromeAppRouter } from './trpc-chrome'

const port = chrome.runtime.connect()
export const chromeClient = createTRPCProxyClient<ChromeAppRouter>({
  links: [chromeLink({ port })]
})
