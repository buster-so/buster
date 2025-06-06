import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChartType } from '../../../../../api/asset_interfaces/metric/charts';
import { LegendItemDot } from '../LegendDot';

const meta = {
  title: 'UI/Charts/LegendDot',
  component: LegendItemDot,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'color' },
    type: {
      control: 'select',
      options: [ChartType.Line, ChartType.Bar, ChartType.Scatter]
    },
    inactive: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'default']
    }
  }
} satisfies Meta<typeof LegendItemDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Bar,
    inactive: false,
    size: 'default'
  }
};

export const Line: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Line,
    inactive: false,
    size: 'default'
  }
};

export const Scatter: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Scatter,
    inactive: false,
    size: 'default'
  }
};

export const Small: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Bar,
    inactive: false,
    size: 'sm'
  }
};

export const Inactive: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Bar,
    inactive: true,
    size: 'default'
  }
};

export const WithFocus: Story = {
  args: {
    color: '#1677ff',
    type: ChartType.Bar,
    inactive: false,
    size: 'default',
    onFocusItem: fn
  }
};
