import { ComponentMeta, ComponentStoryObj } from '@storybook/react'
import { NodeGraphView } from './NodeGraphView'
import { getTrpcMockDecorator } from '../../../../test/TrpcMockProvider'
import { faker } from '@faker-js/faker'
import { NEVER } from 'rxjs'
// ______________________________________________________
//

export default {
  component: NodeGraphView
} as ComponentMeta<typeof NodeGraphView>

const nodes = Array.from({ length: 1 }).map(() => {
  return {
    id: faker.datatype.number(),
    url: faker.internet.url(),
    title: faker.lorem.sentence(),
    childrenIds: [],
    parentIds: []
  }
})
export const Primary: ComponentStoryObj<typeof NodeGraphView> = {
  args: {},
  decorators: [
    getTrpcMockDecorator((mock) => {
      mock.node.getAllFocusedAndItsRelatives.query(() => {
        return nodes.map((node) => node.id)
      })
      mock.node.get.query(({ nodeId }) => {
        const node = nodes.find((node) => node.id === nodeId)
        if (!node) {
          throw new Error('Node not found')
        }
        return node
      })
      mock.node.bulkGet.query((data) => {
        console.log(data)

        const { nodeIds } = data
        return nodeIds.map((nodeId) => {
          const node = nodes.find((node) => node.id === nodeId)
          if (!node) {
            console.log(nodeId, nodes)
            throw new Error('Node not found')
          }
          return node
        })
      })
      mock.node.onUpdate.subscription(() => NEVER)
    })
  ]
}
