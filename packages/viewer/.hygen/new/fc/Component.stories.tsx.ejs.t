---
to: <%= abs_path %>/<%= component_name %>.stories.tsx
---
import { ComponentMeta, ComponentStoryObj } from '@storybook/react'
import { <%= component_name %> } from './<%= component_name %>';
<% if (have_mock) { -%>
import { getTrpcMockDecorator } from '../../../../test/TrpcMockProvider'
<% } -%>
import { expect } from '@storybook/jest'
// ______________________________________________________
//

export default {
  component: <%= component_name %>,
} as ComponentMeta<typeof <%= component_name %>>

export const Primary: ComponentStoryObj<typeof <%= component_name %>> = {
  args: {},
<% if (have_mock) { -%>
  decorators: [
    getTrpcMockDecorator((mock) => {
    }),
  ],
<% } -%>
  play: async ({ canvasElement }) => {

  }
}
