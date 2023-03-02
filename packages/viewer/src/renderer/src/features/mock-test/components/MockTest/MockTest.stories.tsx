import { ComponentMeta, ComponentStoryObj } from '@storybook/react'
import { Component } from './MockTest'
import { getTrpcMockDecorator } from '../../../../test/TrpcMockProvider'
import { delay, of, repeat } from 'rxjs'
// ______________________________________________________
//

export default {
  component: Component
} as ComponentMeta<typeof Component>

export const Primary: ComponentStoryObj<typeof Component> = {
  args: {},
  decorators: [
    getTrpcMockDecorator((mock) => {
      mock.node.get.query(async (input) => {
        return {
          id: input.nodeId,
          childrenIds: [1, 2, 3],
          name: 'hello',
          url: 'https://example.com',
          title: 'file'
        }
      })
      mock.node.onUpdate.subscription(() => {
        return of({
          id: 1,
          childrenIds: [1, 2, 3],
          url: 'https://example.com',
          title: 'file'
        }).pipe(delay(1000), repeat(10))
      })
    })
  ]
}
