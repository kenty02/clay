import { ComponentMeta, ComponentStoryObj } from '@storybook/react'
import { NodeCard } from './NodeCard'
import { getTrpcMockDecorator } from '../../../../test/TrpcMockProvider'
import { faker } from '@faker-js/faker'
// ______________________________________________________
//

export default {
  component: NodeCard
} as ComponentMeta<typeof NodeCard>

export const Primary: ComponentStoryObj<typeof NodeCard> = {
  args: {
    id: 'a',
    name: 'Node Name',
    url: 'https://example.com'
  },
  decorators: [
    getTrpcMockDecorator((mock) => {
      mock.node.get.query(({ nodeId }) => {
        return {
          id: nodeId,
          url: faker.internet.url(),
          title: faker.lorem.sentence(),
          childrenIds: [],
          parentIds: []
        }
      })
    })
  ]
}
