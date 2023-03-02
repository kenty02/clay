import { createStyles } from '@mantine/core'

export default createStyles((theme) => ({
  root: {},
  image: {},
  imagePlaceholder: {
    // color: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2]
  },
  selected: {
    outlineColor: theme.fn.rgba(theme.colors.green[6], 0.5),
    outlineWidth: 5,
    outlineStyle: 'dotted'
  }
}))
