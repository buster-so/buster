import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { EditPieSorting } from './EditPieSorting';

const meta: Meta<typeof EditPieSorting> = {
  title: 'Controllers/MetricController/EditPieSorting',
  component: EditPieSorting,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof EditPieSorting>;

export const SortByKey: Story = {
  args: {
    pieSortBy: 'key',
    onUpdateChartConfig: fn()
  }
};

export const SortByValue: Story = {
  args: {
    pieSortBy: 'value',
    onUpdateChartConfig: fn()
  }
};

export const NoSorting: Story = {
  args: {
    pieSortBy: null,
    onUpdateChartConfig: fn()
  }
};
