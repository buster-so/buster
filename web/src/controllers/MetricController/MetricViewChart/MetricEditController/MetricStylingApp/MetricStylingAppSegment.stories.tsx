import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';
import { MetricStylingAppSegment } from './MetricStylingAppSegment';
import { MetricStylingAppSegments } from './config';

const meta: Meta<typeof MetricStylingAppSegment> = {
  title: 'Controllers/EditMetricController/MetricStylingAppSegment',
  component: MetricStylingAppSegment,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    segment: {
      control: 'select',
      options: Object.values(MetricStylingAppSegments),
      description: 'The currently selected segment'
    },
    setSegment: {
      action: 'setSegment',
      description: 'Function called when segment changes'
    },
    selectedChartType: {
      control: 'select',
      options: Object.values(ChartType),
      description: 'The type of chart currently selected'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply'
    }
  },
  decorators: [
    (Story) => {
      return (
        <div className="w-full min-w-[330px]">
          <Story />
        </div>
      );
    }
  ]
};

export default meta;
type Story = StoryObj<typeof MetricStylingAppSegment>;

// Create a reusable action handler
const handleSetSegment = fn();

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Line,
    className: ''
  }
};

export const WithTableChart: Story = {
  args: {
    segment: MetricStylingAppSegments.VISUALIZE,
    setSegment: handleSetSegment,
    selectedChartType: ChartType.Table,
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: 'When table chart type is selected, Styling and Colors segments are disabled'
      }
    }
  }
};

export const WithMetricChart: Story = {
  args: {
    segment: MetricStylingAppSegments.VISUALIZE,
    setSegment: handleSetSegment,
    selectedChartType: ChartType.Metric,
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: 'When metric chart type is selected, Styling and Colors segments are disabled'
      }
    }
  }
};
