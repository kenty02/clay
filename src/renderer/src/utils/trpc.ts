import { createTRPCReact } from '@trpc/react-query'
import type { appRouter } from '../../../../../clay-host/src/trpc/router' // todo

export const trpc = createTRPCReact<typeof appRouter>()
