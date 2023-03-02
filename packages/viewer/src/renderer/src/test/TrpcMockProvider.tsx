import { trpc } from '../utils/trpc'
import { mockLink } from './mockLink'
import { AppRouter } from 'clay-host/src/trpc/router'
import superjson from 'superjson'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../providers/queryClient'

export const getTrpcMockDecorator = (
  mocker: Parameters<typeof mockLink<AppRouter>>[0]
): ((Story: () => JSX.Element) => JSX.Element) => {
  const TrpcMock = (Story): JSX.Element => (
    <TrpcMockProvider mocker={mocker}>
      <Story />
    </TrpcMockProvider>
  )
  return TrpcMock
}

export const TrpcMockProvider = ({
  children,
  mocker
}: {
  children: React.ReactNode
  mocker: Parameters<typeof mockLink<AppRouter>>[0]
}): JSX.Element => {
  const trpcClient = trpc.createClient({
    links: [mockLink(mocker)],
    transformer: superjson
  })
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
