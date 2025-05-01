import type { Meta, StoryObj } from '@storybook/react';
import { LegendItem } from '../LegendItem';
import { ChartType } from '../../../../../api/asset_interfaces/metric/charts';
import { fn } from '@storybook/test';

const meta = {
  title: 'UI/Charts/LegendItem',
  component: LegendItem,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    item: {
      color: '#1677ff',
      inactive: false,
      type: ChartType.Line,
      formattedName: 'Sample Legend',
      id: '1',
      serieName: 'series1',
      data: [],
      yAxisKey: 'revenue'
    }
  },
  argTypes: {
    item: {
      control: 'object',
      description: 'The legend item configuration'
    },
    onClickItem: {
      action: 'clicked',
      description: 'Function called when the legend item is clicked'
    },
    onFocusItem: {
      action: 'focused',
      description: 'Function called when the legend item is focused'
    },
    onHoverItem: {
      action: 'hovered',
      description: 'Function called when the legend item is hovered'
    }
  }
} satisfies Meta<typeof LegendItem>;

export default meta;
type Story = StoryObj<typeof LegendItem>;

// Basic legend item
export const Basic: Story = {
  args: {
    item: {
      color: '#1677ff',
      inactive: false,
      type: ChartType.Line,
      formattedName: 'Basic Legend',
      id: '1',
      serieName: 'series1',
      data: [],
      yAxisKey: 'revenue'
    }
  }
};

// Inactive legend item
export const Inactive: Story = {
  args: {
    item: {
      color: '#0066FF',
      inactive: true,
      type: ChartType.Line,
      formattedName: 'Inactive Legend',
      id: '2',
      serieName: 'series2',
      data: [],
      yAxisKey: 'revenue'
    }
  }
};

// Bar type legend item
export const BarType: Story = {
  args: {
    item: {
      color: '#52c41a',
      inactive: false,
      type: ChartType.Bar,
      formattedName: 'Bar Legend',
      id: '3',
      serieName: 'series3',
      data: [],
      yAxisKey: 'revenue'
    }
  }
};

// Scatter type legend item
export const ScatterType: Story = {
  args: {
    item: {
      color: '#722ed1',
      inactive: false,
      type: ChartType.Scatter,
      formattedName: 'Scatter Legend',
      id: '4',
      serieName: 'series4',
      data: [],
      yAxisKey: 'revenue'
    }
  }
};

// With headline
export const WithHeadline: Story = {
  args: {
    item: {
      color: '#f5222d',
      inactive: false,
      type: ChartType.Line,
      formattedName: 'Revenue',
      id: '5',
      serieName: 'series5',
      data: [],
      yAxisKey: 'revenue',
      headline: {
        type: 'current',
        titleAmount: '$50,000'
      }
    }
  }
};

// With average headline
export const WithAverageHeadline: Story = {
  args: {
    item: {
      color: '#fa8c16',
      inactive: false,
      type: ChartType.Line,
      formattedName: 'Monthly Sales',
      id: '6',
      serieName: 'series6',
      data: [],
      yAxisKey: 'revenue',
      headline: {
        type: 'average',
        titleAmount: '$25,000'
      }
    }
  }
};

// Interactive example with all handlers
export const WithFocusEvent: Story = {
  args: {
    item: {
      color: '#eb2f96',
      inactive: false,
      type: ChartType.Line,
      formattedName: 'Interactive Legend',
      id: '7',
      serieName: 'series7',
      data: [],
      yAxisKey: 'revenue'
    },
    onClickItem: fn(),
    onFocusItem: fn(),
    onHoverItem: fn()
  }
};
