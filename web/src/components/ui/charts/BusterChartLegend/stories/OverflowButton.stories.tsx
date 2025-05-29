import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChartType } from '../../../../../api/asset_interfaces/metric/charts';
import type { BusterChartLegendItem } from '../interfaces';
import { OverflowButton } from '../OverflowContainer';

const meta = {
  title: 'UI/Charts/OverflowButton',
  component: OverflowButton,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof OverflowButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLegendItems: BusterChartLegendItem[] = [
  {
    id: '1',
    color: '#FF5733',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Series A',
    serieName: 'series-a',
    data: [],
    yAxisKey: 'revenue'
  },
  {
    id: '2',
    color: '#33FF57',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Series B',
    serieName: 'series-b',
    data: [],
    yAxisKey: 'revenue'
  },
  {
    id: '3',
    color: '#3357FF',
    inactive: true,
    type: ChartType.Line,
    formattedName: 'Inactive Series C',
    serieName: 'series-c',
    data: [],
    yAxisKey: 'revenue'
  }
];

export const Default: Story = {
  args: {
    legendItems: mockLegendItems,
    onClickItem: fn(),
    onFocusClick: fn()
  }
};

export const WithInactiveItems: Story = {
  args: {
    legendItems: mockLegendItems.map((item) => ({ ...item, inactive: true }))
  }
};

export const WithManyItems: Story = {
  args: {
    legendItems: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      color: `hsl(${(i * 36) % 360}, 70%, 50%)`,
      inactive: false,
      type: ChartType.Line,
      formattedName: `Series ${String.fromCharCode(65 + i)}`,
      serieName: `series-${String.fromCharCode(97 + i)}`,
      data: [],
      yAxisKey: 'revenue'
    }))
  }
};
