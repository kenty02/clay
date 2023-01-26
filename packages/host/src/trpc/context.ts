import type { inferAsyncReturnType } from '@trpc/server'
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws'

// placeholder
/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/no-unused-vars
export async function createContext(_opts: CreateWSSContextFnOptions) {
  await new Promise((resolve) => setTimeout(resolve, 1))
  return {}
}

export type Context = inferAsyncReturnType<typeof createContext>
