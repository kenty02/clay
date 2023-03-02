import { Tabs } from '@mantine/core'
import { NodeQuickSwitchView } from '@renderer/features/node-view/components/NodeQuickSwitchView'
import { IconArrowsLeftRight, IconHierarchy } from '@tabler/icons-react'
import { NodeGraphView } from '../../features/node-view/components/NodeGraphView'
import { ReactNode } from 'react'

type ContainerProps = {}
type Props = {
  graph: ReactNode
  hqs: ReactNode
} & ContainerProps

export const Component = ({ graph, hqs }: Props): JSX.Element => (
  <>
    <Tabs defaultValue="hqs">
      <Tabs.List>
        <Tabs.Tab value="graph" icon={<IconHierarchy size={14} />}>
          Graph
        </Tabs.Tab>
        <Tabs.Tab value="hqs" icon={<IconArrowsLeftRight size={14} />}>
          HQS
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="graph">{graph}</Tabs.Panel>

      <Tabs.Panel value="hqs">{hqs}</Tabs.Panel>
    </Tabs>
  </>
)

export const SelectableNodeView = (props: ContainerProps): JSX.Element => {
  return <Component {...{ ...props, hqs: <NodeQuickSwitchView />, graph: <NodeGraphView /> }} />
}
