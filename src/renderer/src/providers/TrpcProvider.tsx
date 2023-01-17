import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { trpc } from '../utils/trpc'
import { createWSClient, wsLink } from '@trpc/client'
import superjson from 'superjson'
import { showNotification } from '@mantine/notifications'

// strict modeで2回呼ばれるのを防ぐためにここで呼ぶ
const wsClient = createWSClient({
  url: `ws://localhost:3003/ws`,
  onOpen: () => {
    if (import.meta.env.DEV) {
      showNotification({ message: 'ws opened' })
    }
  },
  onClose: () => {
    if (import.meta.env.DEV) {
      showNotification({ message: 'ws closed' })
    }
  }
})
const trpcClient = trpc.createClient({
  links: [
    // adds pretty logs to your console in development and logs errors in production
    // loggerLink({
    //   enabled: (opts) =>
    //     (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
    //     (opts.direction === 'down' && opts.result instanceof Error)
    // }),
    wsLink({
      client: wsClient
    })
  ],
  transformer: superjson
})
const queryClient = new QueryClient({ defaultOptions: { queries: { suspense: true } } })

function TrpcProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

export default TrpcProvider
