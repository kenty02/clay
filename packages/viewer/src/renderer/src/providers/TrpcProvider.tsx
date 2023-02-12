import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { trpc } from '../utils/trpc'
import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client'
import superjson from 'superjson'
import { showNotification } from '@mantine/notifications'
import { ipcLink } from 'electron-trpc/renderer'
import { ElectronAppRouter } from '../../../main/trpc/router'

export const electronClient = createTRPCProxyClient<ElectronAppRouter>({
  links: [ipcLink()],
  transformer: superjson
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TRPCClient = any
let trpcClient: TRPCClient | null

const queryClient = new QueryClient({ defaultOptions: { queries: { suspense: true } } })

function TrpcProvider({ children }: PropsWithChildren): JSX.Element {
  if (trpcClient == null) {
    const createPromise = (async (): Promise<void> => {
      const relayInfos = await electronClient.getRelayInfos.query()
      if (relayInfos.length === 0)
        throw new Error('no relay found, please install clay extension in your browser and start')
      else if (relayInfos.length > 1)
        throw new Error(`${relayInfos.length} relays found, only one host is supported now`)

      const port = relayInfos[0].port

      // strict modeで2回呼ばれるのを防ぐために一回のみ呼ぶ
      const wsClient = createWSClient({
        url: `ws://localhost:${port}/ws`,
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

      trpcClient = trpc.createClient({
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
    })()
    throw createPromise
  }
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <DebugLogSubscriber />
    </trpc.Provider>
  )
}

function DebugLogSubscriber(): null {
  trpc.debug.onLog.useSubscription(undefined, {
    onData: (log) => {
      window.electron.ipcRenderer.invoke('writeLogEntry', log)
    }
  })
  return null
}

export default TrpcProvider
