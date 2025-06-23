import type { Meta, StoryObj } from '@storybook/react';
import { MyYamlEditor } from './validateMetricYaml';

const meta: Meta<typeof MyYamlEditor> = {
  title: 'Lib/Files/MyYamlEditorWithValidation',
  component: MyYamlEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="m-12 h-[600px] min-h-[600px] w-[800px] min-w-[800px] border">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof MyYamlEditor>;

export const Default: Story = {
  args: {}
};
