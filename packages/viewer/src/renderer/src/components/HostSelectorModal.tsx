import { Button, Group, List, Modal } from '@mantine/core'

type Props = {
  relayInfos: {
    port: number
  }[]
  onSelected: (port: number) => void
}
export default function HostSelectorModal({ relayInfos, onSelected }: Props): JSX.Element {
  return (
    <>
      <Modal
        opened={true}
        onClose={(): void => {
          // noop
        }}
        title="Select which browser you want to connect"
      >
        <List>
          {relayInfos.map((relayInfo) => (
            <Group key={relayInfo.port}>
              <Button onClick={(): void => onSelected(relayInfo.port)}>
                localhost:{relayInfo.port}
              </Button>
            </Group>
          ))}
        </List>
      </Modal>
    </>
  )
}
