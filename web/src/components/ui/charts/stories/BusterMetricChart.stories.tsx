import type { Meta, StoryObj } from '@storybook/react';
import { BusterMetricChart } from '../MetricChart/BusterMetricChart';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

const meta: Meta<typeof BusterMetricChart> = {
  title: 'UI/Charts/BusterChart/BusterMetricChart',
  component: BusterMetricChart,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof BusterMetricChart>;

export default meta;
type Story = StoryObj<typeof BusterMetricChart>;

export const Basic: Story = {
  args: {
    data: [{ value: 1234, category: 'Sales' }],
    metricColumnId: 'value',
    columnLabelFormats: {
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies ColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'Total Count',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithCurrency: Story = {
  args: {
    data: [{ revenue: 5250.75, month: 'January' }],
    metricColumnId: 'revenue',
    columnLabelFormats: {
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies ColumnLabelFormat,
      month: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'Monthly Revenue',
    metricSubHeader: 'January 2024',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithAggregate: Story = {
  args: {
    data: [
      { sales: 1200, region: 'North' },
      { sales: 1500, region: 'South' },
      { sales: 2300, region: 'East' },
      { sales: 1800, region: 'West' }
    ],
    metricColumnId: 'sales',
    metricValueAggregate: 'sum',
    columnLabelFormats: {
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies ColumnLabelFormat,
      region: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'Total Sales',
    metricSubHeader: 'All Regions',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithDynamicHeaders: Story = {
  args: {
    data: [{ count: 42, category: 'Active Users', date: '2024-03-15' }],
    metricColumnId: 'count',
    metricHeader: { columnId: 'category', useValue: true },
    metricSubHeader: { columnId: 'date', useValue: true },
    columnLabelFormats: {
      count: {
        columnType: 'number',
        style: 'number'
      } satisfies ColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies ColumnLabelFormat
    },
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const NoAnimation: Story = {
  args: {
    data: [{ value: 87.5, unit: 'Percent' }],
    metricColumnId: 'value',
    columnLabelFormats: {
      value: {
        columnType: 'number',
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies ColumnLabelFormat,
      unit: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'Completion Rate',
    animate: false
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const CustomValueLabel: Story = {
  args: {
    data: [{ value: 1500, type: 'New Users' }],
    metricColumnId: 'value',
    metricValueLabel: '1.5K',
    columnLabelFormats: {
      value: {
        columnType: 'number',
        style: 'number'
      } satisfies ColumnLabelFormat,
      type: {
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'User Growth',
    metricSubHeader: 'Last Month',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};
