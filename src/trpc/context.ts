import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateWSSContextFnOptions) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return {};
}

export type Context = inferAsyncReturnType<typeof createContext>;
