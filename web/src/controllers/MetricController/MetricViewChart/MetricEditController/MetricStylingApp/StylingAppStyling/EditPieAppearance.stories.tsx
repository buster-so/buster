import { DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { EditPieAppearance } from './EditPieAppearance';

const meta: Meta<typeof EditPieAppearance> = {
  title: 'Controllers/EditMetricController/EditPieAppearance',
  component: EditPieAppearance,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="bg-background w-[400px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof EditPieAppearance>;

export const Default: Story = {
  args: {
    pieDonutWidth: DEFAULT_CHART_CONFIG.pieDonutWidth,
    onUpdateChartConfig: fn(),
    pieChartAxis: {
      x: [],
      y: [],
      tooltip: null
    }
  }
};

export const PieChart: Story = {
  args: {
    pieDonutWidth: 0,
    onUpdateChartConfig: fn(),
    pieChartAxis: {
      x: [],
      y: [],
      tooltip: null
    }
  }
};

export const DonutChart: Story = {
  args: {
    pieDonutWidth: 30,
    onUpdateChartConfig: fn(),
    pieChartAxis: {
      x: [],
      y: [],
      tooltip: null
    }
  }
};

export const MultipleYAxis: Story = {
  args: {
    pieDonutWidth: 40,
    onUpdateChartConfig: fn(),
    pieChartAxis: {
      x: [],
      y: ['column1', 'column2'],
      tooltip: null
    }
  }
};
