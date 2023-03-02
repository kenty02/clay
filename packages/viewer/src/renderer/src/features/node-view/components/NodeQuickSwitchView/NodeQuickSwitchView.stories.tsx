import { ComponentMeta, ComponentStoryObj } from '@storybook/react'

import { NodeQuickSwitchView } from './NodeQuickSwitchView'
import { expect } from '@storybook/jest'

export default {
  component: NodeQuickSwitchView
} as ComponentMeta<typeof NodeQuickSwitchView>

export const Primary: ComponentStoryObj<typeof NodeQuickSwitchView> = {
  args: {
    leftNodeCards: [
      {
        id: 'a',
        name: 'localhost:1234',
        url: 'https://example.com'
      }
    ],
    centerNodeCards: [
      {
        id: 'a',
        name: 'localhost:1234',
        url: 'https://example.com'
      }
    ],
    rightNodeCards: [
      {
        id: 'a',
        name: 'localhost:1234',
        url: 'https://example.com'
      }
    ]
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain('localhost:1234')
    expect(canvasElement.textContent).not.toContain('localhost:12345')
  }
}
