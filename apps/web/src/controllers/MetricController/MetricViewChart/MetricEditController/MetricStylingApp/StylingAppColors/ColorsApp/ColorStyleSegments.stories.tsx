import type { Meta, StoryObj } from '@storybook/react';
import { ColorStyleSegments } from './ColorStyleSegments';
import { ColorAppSegments } from './config';

const meta: Meta<typeof ColorStyleSegments> = {
  title: 'Controllers/EditMetricController/ColorStyleSegments',
  component: ColorStyleSegments,
  parameters: {
    layout: 'centered'
  },
  //tags: ['autodocs'],
  argTypes: {
    selectedSegment: {
      control: 'select',
      options: Object.values(ColorAppSegments),
      description: 'The initially selected segment'
    },
    setSelectedSegment: {
      action: 'setSelectedSegment',
      description: 'Callback when segment selection changes'
    }
  },
  decorators: [
    (Story) => (
      <div className="flex w-[400px] flex-col items-center justify-center p-4">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ColorStyleSegments>;

export const Default: Story = {
  args: {
    selectedSegment: ColorAppSegments.Colorful
  }
};

export const MonochromeSelected: Story = {
  args: {
    selectedSegment: ColorAppSegments.Monochrome
  }
};
