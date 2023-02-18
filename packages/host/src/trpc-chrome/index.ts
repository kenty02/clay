import { initTRPC } from '@trpc/server'
import { createChromeHandler } from 'trpc-chrome/adapter'
import { z } from 'zod'

const tc = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true
})

export const chromeAppRouter = tc.router({
  ping: tc.procedure.input(z.string()).query(({ input }) => {
    return 'pong ' + input
  })
})

export type ChromeAppRouter = typeof chromeAppRouter

createChromeHandler({
  router: chromeAppRouter
})
