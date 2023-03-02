import { QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren, useEffect, useState } from 'react'
import { trpc } from '../utils/trpc'
import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client'
import superjson from 'superjson'
import { notifications } from '@mantine/notifications'
import { ipcLink } from 'electron-trpc/renderer'
import { ElectronAppRouter } from '../../../main/trpc/router'
import { HostSelectorModal } from '../components/HostSelectorModal/HostSelectorModal'
import { useAction } from './SpotlightProvider'
import { queryClient } from './queryClient'

export const electronClient = createTRPCProxyClient<ElectronAppRouter>({
  links: [ipcLink()],
  transformer: superjson
})

let wsClient: ReturnType<typeof createWSClient> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TRPCClient = any
let trpcClient: TRPCClient | null

function TrpcProvider({ children }: PropsWithChildren): JSX.Element {
  const [selectedRelayPort, setSelectedRelayPort] = useState<number | null>(null)
  const [relayInfos, setRelayInfos] = useState<Awaited<
    ReturnType<(typeof electronClient)['getRelayInfos']['query']>
  > | null>(null)
  const [error, setError] = useState<Error | null>(null)
  if (error) throw error

  useEffect(() => {
    electronClient.getRelayInfos.query().then(setRelayInfos).catch(setError)
  }, [])

  const reset = (): void => {
    if (wsClient != null) {
      notifications.show({ message: 'Connection to the host extension gone' })
      const closingWsClient = wsClient
      wsClient = null
      closingWsClient.close()
      trpcClient = null
      setSelectedRelayPort(null)
    }
  }

  useAction('reset trpc', () => {
    reset()
  })

  if (trpcClient == null) {
    if (relayInfos == null) {
      return <div>fetching relay info, please wait...</div>
    }

    if (selectedRelayPort == null) {
      if (relayInfos.length !== 1) {
        return (
          <HostSelectorModal
            relayInfos={relayInfos}
            onSelected={(port): void => {
              setSelectedRelayPort(port)
            }}
          />
        )
      } else {
        setSelectedRelayPort(relayInfos[0].port)
        return <div>connecting, please wait...</div>
      }
    }

    const clientCreatePromise = (async (): Promise<void> => {
      const port = relayInfos.length === 1 ? relayInfos[0].port : selectedRelayPort
      if (port == null) return
      const token = relayInfos.find((info) => info.port === port)?.token

      // strict modeで2回呼ばれるのを防ぐために一回のみ呼ぶ
      wsClient = createWSClient({
        url: `ws://localhost:${port}/ws?token=${token}`,
        onOpen: () => {
          if (import.meta.env.DEV) {
            notifications.show({ message: 'ws opened' })
          }
        },
        onClose: (cause) => {
          console.log('ws closed', cause)
          reset()
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
    throw clientCreatePromise
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
