import { ComponentMeta, ComponentStoryObj } from '@storybook/react'

import { Component } from './SelectableNodeView'

export default {
  component: Component
} as ComponentMeta<typeof Component>

export const HasSome: ComponentStoryObj<typeof Component> = {
  args: {
    hqs: <div>hqs</div>,
    graph: <div>graph</div>
  }
}
