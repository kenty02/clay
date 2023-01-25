import {Button, MantineProvider, Text} from '@mantine/core'
import TrpcProvider from './providers/TrpcProvider'
import {Suspense} from 'react'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {NotificationsProvider} from '@mantine/notifications'
import {ErrorBoundary, FallbackProps} from 'react-error-boundary'
import NodeGraphView from "./components/NodeGraphView";

function App(): JSX.Element {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <NotificationsProvider position={'top-right'}>
        <Suspense fallback={<Text>Loading...</Text>}>
          <TrpcProvider>
            <Button
              onClick={(): void => {
                location.reload()
              }}
            >
              Reload
            </Button>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={(): void => {
                // reset the state of your app so the error doesn't happen again
              }}
            >
              <Suspense fallback={<Text>Loading...</Text>}>
                <NodeGraphView/>
              </Suspense>
            </ErrorBoundary>
            <ReactQueryDevtools panelPosition={"top"}/>
          </TrpcProvider>
        </Suspense>
      </NotificationsProvider>
    </MantineProvider>
  )
}

function ErrorFallback({error, resetErrorBoundary}: FallbackProps): JSX.Element {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default App
