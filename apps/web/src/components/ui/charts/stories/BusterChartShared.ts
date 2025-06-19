import type { Meta } from '@storybook/react';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { DEFAULT_CHART_CONFIG } from '../../../../api/asset_interfaces/metric/defaults';
import { BusterChart } from '../BusterChart';

export const sharedMeta: Partial<Meta<typeof BusterChart>> = {
  component: BusterChart,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    colors: {
      description:
        'Array of colors to be used for the chart series. If not provided, defaults to the theme colors.',
      control: { type: 'object' },
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: 'DEFAULT_CHART_THEME' }
      }
    },
    selectedChartType: {
      control: 'select',
      description: 'The type of chart to display.',
      defaultValue: ChartType.Table,
      options: Object.values(ChartType)
    },
    xAxisTimeInterval: {
      control: 'select',
      description:
        'Time interval for x-axis when displaying time series data. Only applies to combo and line charts.',
      options: ['day', 'week', 'month', 'quarter', 'year', null],
      table: {
        type: { summary: "'day' | 'week' | 'month' | 'quarter' | 'year' | null" },
        defaultValue: { summary: 'null' }
      }
    }
  },
  args: {
    ...DEFAULT_CHART_CONFIG,
    className: 'w-[400px] h-[400px]'
  }
};
