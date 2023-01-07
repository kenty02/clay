import { MantineProvider, Text } from '@mantine/core'
import NodeTableView from './components/NodeTableView'
import TrpcProvider from './providers/TrpcProvider'

function App(): JSX.Element {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <TrpcProvider>
        <Text>Welcome to Mantine</Text>
        <NodeTableView />
      </TrpcProvider>
    </MantineProvider>
  )
}

export default App
