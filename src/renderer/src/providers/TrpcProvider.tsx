import { QueryClient } from '@tanstack/react-query'
import { PropsWithChildren, useState } from 'react'
import { trpc } from '../utils/trpc'
import { createWSClient, loggerLink, wsLink } from '@trpc/client'
import superjson from 'superjson'

// strict modeで2回呼ばれるのを防ぐためにここで呼ぶ
const wsClient = createWSClient({
  url: `ws://localhost:3003/ws`
})
const trpcClient = trpc.createClient({
  links: [
    // adds pretty logs to your console in development and logs errors in production
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error)
    }),
    wsLink({
      client: wsClient
    })
  ],
  transformer: superjson
})

function TrpcProvider({ children }: PropsWithChildren): JSX.Element {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  )
}

export default TrpcProvider
