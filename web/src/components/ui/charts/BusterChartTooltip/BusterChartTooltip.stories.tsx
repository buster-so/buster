import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { BusterChartTooltip } from './BusterChartTooltip';

const meta: Meta<typeof BusterChartTooltip> = {
  title: 'UI/Charts/BusterChartTooltip',
  component: BusterChartTooltip,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="rounded-sm border shadow-lg">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof BusterChartTooltip>;

const baseTooltipItems = [
  {
    color: '#1677ff',
    seriesType: 'line',
    formattedLabel: 'Series 1',
    values: [
      {
        formattedValue: 100,
        formattedLabel: 'Value',
        formattedPercentage: '50%'
      }
    ],
    usePercentage: true
  },
  {
    color: '#52c41a',
    seriesType: 'line',
    formattedLabel: 'Series 2',
    values: [
      {
        formattedValue: 200,
        formattedLabel: 'Value',
        formattedPercentage: '100%'
      }
    ],
    usePercentage: true
  }
];

const scatterTooltipItems = [
  {
    color: '#1677ff',
    seriesType: 'scatter',
    formattedLabel: 'Point A',
    values: [
      {
        formattedValue: '10 dollars',
        formattedLabel: 'X',
        formattedPercentage: undefined
      },
      {
        formattedValue: '20 years',
        formattedLabel: 'Y',
        formattedPercentage: undefined
      }
    ],
    usePercentage: false
  }
];

const manyTooltipItems = Array.from({ length: 15 }, (_, i) => ({
  color: `hsl(${i * 20}, 70%, 50%)`,
  seriesType: 'line',
  formattedLabel: `Series ${i + 1}`,
  values: [
    {
      formattedValue: (i + 1) * 100,
      formattedLabel: 'Value',
      formattedPercentage: `${(i + 1) * 10}%`
    }
  ],
  usePercentage: true
}));

export const Default: Story = {
  args: {
    tooltipItems: baseTooltipItems,
    title: 'Chart Data'
  }
};

export const WithScatterPlot: Story = {
  args: {
    tooltipItems: scatterTooltipItems,
    title: '' //scatter typically does not have a title
  }
};

export const WithManyItems: Story = {
  args: {
    tooltipItems: manyTooltipItems,
    title: 'Many Series'
  }
};

export const NoTitle: Story = {
  args: {
    tooltipItems: baseTooltipItems,
    title: undefined
  }
};
