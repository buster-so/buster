import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { EditBarSorting } from './EditBarAxisSorting';

const meta: Meta<typeof EditBarSorting> = {
  title: 'Controllers/EditMetricController/EditBarAxisSorting',
  component: EditBarSorting,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    barSortBy: {
      control: 'select',
      options: [['none'], ['asc'], ['desc']],
      description: 'The current sort order for bar charts'
    },
    onUpdateChartConfig: {
      action: 'onUpdateChartConfig',
      description: 'Callback when sort order changes'
    }
  },
  decorators: [
    (Story) => (
      <div className="flex w-[300px] flex-col items-center justify-center p-4">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof EditBarSorting>;

export const Default: Story = {
  args: {
    barSortBy: ['none'],
    onUpdateChartConfig: fn()
  }
};

export const SortAscending: Story = {
  args: {
    barSortBy: ['asc'],
    onUpdateChartConfig: fn()
  }
};

export const SortDescending: Story = {
  args: {
    barSortBy: ['desc'],
    onUpdateChartConfig: fn()
  }
};

export const WithInteraction: Story = {
  args: {
    barSortBy: ['none'],
    onUpdateChartConfig: fn()
  },
  play: async ({ canvasElement, args }) => {
    // This is where you could add interaction tests using the @storybook/testing-library
    // For example, clicking on different sort options and verifying the onUpdateChartConfig callback is called
  }
};
