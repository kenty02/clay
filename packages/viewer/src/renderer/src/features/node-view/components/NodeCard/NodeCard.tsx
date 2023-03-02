import useStyles from './NodeCard.styles'
import { Group, Image, Paper, Text } from '@mantine/core'
// ______________________________________________________
//
export type Props = {
  id: string
  imageSrc?: string
  name: string
  url: string
  selected?: boolean
}
// ______________________________________________________
//
export const NodeCard = ({ imageSrc, name, url, selected }: Props): JSX.Element => {
  const { classes, cx } = useStyles()

  return (
    <Paper className={cx(classes.root, selected ? classes.selected : null)} shadow="xs" p="md">
      <Group spacing="xs" noWrap={true}>
        <Image
          width="5rem"
          height="5rem"
          radius={999}
          className={cx(classes.image, imageSrc ? null : classes.imagePlaceholder)}
          src={imageSrc}
          placeholder={<Text size="xl">{name[0]}</Text>}
        />
        <div>
          <Text size="xl" weight={500}>
            {name}
          </Text>
          <Text size="xs" color="gray">
            {url}
          </Text>
        </div>
      </Group>
    </Paper>
  )
}
