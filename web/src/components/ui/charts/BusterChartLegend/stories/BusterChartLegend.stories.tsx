import type { Meta, StoryObj } from '@storybook/react';
import { BusterChartLegend } from '../BusterChartLegend';
import { ChartType } from '../../../../../api/asset_interfaces/metric/charts';
import type { BusterChartLegendItem } from '../interfaces';

const meta: Meta<typeof BusterChartLegend> = {
  title: 'UI/Charts/BusterChartLegend',
  component: BusterChartLegend,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    onClickItem: { action: 'clicked' },
    onFocusItem: { action: 'focused' },
    showLegendHeadline: {
      control: 'select',
      description:
        'Show the legend headline will only work if a headline is provided (see example)',
      options: [false, 'total', 'average', 'min', 'max', 'current', 'median']
    }
  }
};

export default meta;
type Story = StoryObj<typeof BusterChartLegend>;

const defaultLegendItems: BusterChartLegendItem[] = [
  {
    color: '#1677FF',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Revenue',
    id: 'revenue',
    serieName: 'revenue',
    data: [],
    yAxisKey: 'revenue'
  },
  {
    color: '#52C41A',
    inactive: false,
    type: ChartType.Line,
    formattedName: 'Profit',
    id: 'profit',
    serieName: 'profit',
    data: [],
    yAxisKey: 'profit'
  },
  {
    color: '#F5222D',
    inactive: false,
    type: ChartType.Bar,
    formattedName: 'Orders',
    id: 'orders',
    serieName: 'orders',
    data: [],
    yAxisKey: 'orders'
  }
];

export const Default: Story = {
  args: {
    legendItems: defaultLegendItems,
    show: true,
    animateLegend: true,
    containerWidth: 600,
    showLegendHeadline: false,
    onClickItem: () => {},
    onFocusItem: () => {}
  }
};

export const WithHeadline: Story = {
  args: {
    legendItems: [
      {
        ...defaultLegendItems[0],
        headline: {
          type: 'total',
          titleAmount: '$1,234,567'
        }
      },
      {
        ...defaultLegendItems[1],
        headline: {
          type: 'total',
          titleAmount: '$567,890'
        }
      },
      {
        ...defaultLegendItems[2],
        headline: {
          type: 'total',
          titleAmount: '$98,765'
        }
      }
    ],
    show: true,
    animateLegend: true,
    containerWidth: 600,
    showLegendHeadline: 'total'
  }
};

export const WithOverflow: Story = {
  args: {
    legendItems: [
      ...defaultLegendItems,
      {
        color: '#722ED1',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Customers',
        id: 'customers',
        serieName: 'customers',
        data: [],
        yAxisKey: 'customers'
      },
      {
        color: '#13C2C2',
        inactive: false,
        type: ChartType.Line,
        formattedName: 'Average Order Value',
        id: 'aov',
        serieName: 'aov',
        data: [],
        yAxisKey: 'aov'
      },
      {
        color: '#FA8C16',
        inactive: false,
        type: ChartType.Bar,
        formattedName: 'Returns',
        id: 'returns',
        serieName: 'returns',
        data: [],
        yAxisKey: 'returns'
      }
    ],
    show: true,
    animateLegend: true,
    containerWidth: 400,
    showLegendHeadline: undefined,
    onClickItem: () => {},
    onFocusItem: () => {}
  }
};

export const Hidden: Story = {
  args: {
    legendItems: defaultLegendItems,
    show: false,
    animateLegend: true,
    containerWidth: 600,
    showLegendHeadline: undefined,
    onClickItem: () => {},
    onFocusItem: () => {}
  }
};
