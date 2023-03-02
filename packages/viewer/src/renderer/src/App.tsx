import { MantineProvider, Text } from '@mantine/core'
import TrpcProvider from './providers/TrpcProvider'
import { Suspense } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NotificationsProvider } from '@mantine/notifications'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import SpotlightProvider from './providers/SpotlightProvider'
import { SelectableNodeView } from './components/SelectableNodeView'

function App(): JSX.Element {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <NotificationsProvider position={'top-right'}>
        <SpotlightProvider>
          <Suspense fallback={<Text>Loading...</Text>}>
            <TrpcProvider>
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={(): void => {
                  // reset the state of your app so the error doesn't happen again
                }}
              >
                <Suspense fallback={<Text>Loading...</Text>}>
                  <SelectableNodeView />
                </Suspense>
              </ErrorBoundary>
              <ReactQueryDevtools panelPosition={'top'} />
            </TrpcProvider>
          </Suspense>
        </SpotlightProvider>
      </NotificationsProvider>
    </MantineProvider>
  )
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps): JSX.Element {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default App
