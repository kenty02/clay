import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from 'clay-host/src/trpc/router'

export const trpc = createTRPCReact<AppRouter>()
