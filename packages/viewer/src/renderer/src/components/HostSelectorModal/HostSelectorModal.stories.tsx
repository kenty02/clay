import { ComponentMeta, ComponentStoryObj } from '@storybook/react'

import { Component } from './HostSelectorModal'

export default {
  component: Component
} as ComponentMeta<typeof Component>

export const HasSome: ComponentStoryObj<typeof Component> = {
  args: {
    relays: [
      {
        id: 'a',
        name: 'localhost:1234',
        tags: ['tag1', 'tag2']
      }
    ]
  }
}
