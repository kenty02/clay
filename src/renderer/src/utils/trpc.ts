import { createTRPCReact } from '@trpc/react-query'
import type { appRouter } from 'trpc/router'

export const trpc = createTRPCReact<typeof appRouter>()
