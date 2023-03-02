import useStyles from './NodeQuickSwitchView.styles'
import { Container, SimpleGrid, Stack } from '@mantine/core'
import { NodeCard } from '../NodeCard'
import { ComponentProps } from 'react'

type Props = {
  leftNodeCards?: ComponentProps<typeof NodeCard>[]
  centerNodeCards?: ComponentProps<typeof NodeCard>[]
  rightNodeCards?: ComponentProps<typeof NodeCard>[]
}

export const NodeQuickSwitchView = ({
  leftNodeCards = [],
  centerNodeCards = [],
  rightNodeCards = []
}: Props): JSX.Element => {
  const { classes } = useStyles()

  return (
    <Container size={'md'}>
      <SimpleGrid cols={3} spacing="md">
        <Stack className={classes.nodeStack}>
          {leftNodeCards.map((nodeCard) => (
            <NodeCard key={nodeCard.id} {...nodeCard} />
          ))}
        </Stack>
        <Stack className={classes.nodeStack}>
          {centerNodeCards.map((nodeCard) => (
            <NodeCard key={nodeCard.id} {...nodeCard} />
          ))}
        </Stack>
        <Stack className={classes.nodeStack}>
          {rightNodeCards.map((nodeCard) => (
            <NodeCard key={nodeCard.id} {...nodeCard} />
          ))}
        </Stack>
      </SimpleGrid>
    </Container>
  )
}
