import { Button, Group, List, Modal } from '@mantine/core'

type ContainerProps = {
  relayInfos: {
    port: number
    tags: string[]
  }[]
  onSelected: (port: number) => void
}
type Props = {
  relays: {
    id: string // key
    name: string
    tags: string[]
  }[]
  onRelaySelected: (id: string) => void
} & ContainerProps

export const Component = ({ relays, onRelaySelected }: Props): JSX.Element => (
  <>
    <Modal
      opened={true}
      onClose={(): void => {
        // noop
      }}
      title="Select which browser you want to connect"
    >
      <List>
        {relays.map((relay) => (
          <Group key={relay.name}>
            <Button onClick={(): void => onRelaySelected(relay.id)}>
              {relay.name}
              {relay.tags.length > 0 ? ` (${relay.tags.join(', ')})` : ''}
            </Button>
          </Group>
        ))}
      </List>
    </Modal>
  </>
)

export const HostSelectorModal = (props: ContainerProps): JSX.Element => {
  const getRelayName = (relayInfo: { port: number; tags: string[] }): string => {
    return `localhost:${relayInfo.port}`
  }
  const relays = props.relayInfos.map((relayInfo) => ({
    name: getRelayName(relayInfo),
    id: String(relayInfo.port),
    tags: relayInfo.tags
  }))
  return (
    <Component
      {...props}
      relays={relays}
      onRelaySelected={(id): void => {
        const port = props.relayInfos.find((relay) => String(relay.port) === id)?.port
        if (port == null) throw new Error(`port is null: ${id}`)
        props.onSelected(port)
      }}
    />
  )
}
