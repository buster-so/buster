import type { Meta, StoryObj } from '@storybook/react';
import { AppCodeEditor } from './AppCodeEditor';

const meta: Meta<typeof AppCodeEditor> = {
  title: 'UI/Inputs/AppCodeEditor',
  component: AppCodeEditor,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppCodeEditor>;

const sampleSQLCode = `SELECT users.name, orders.order_date
FROM users
JOIN orders ON users.id = orders.user_id
WHERE orders.status = 'completed'
ORDER BY orders.order_date DESC;`;

const sampleYAMLCode = `version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./src:/usr/share/nginx/html`;

export const Default: Story = {
  args: {
    value: sampleSQLCode,
    height: '300px',
    language: 'pgsql',
    variant: 'bordered'
  }
};

export const ReadOnly: Story = {
  args: {
    value: sampleSQLCode,
    height: '300px',
    language: 'pgsql',
    readOnly: true,
    variant: 'bordered',
    readOnlyMessage: 'This is a read-only view'
  }
};

export const YAMLEditor: Story = {
  args: {
    value: sampleYAMLCode,
    height: '300px',
    language: 'yaml',
    variant: 'bordered'
  }
};

export const CustomHeight: Story = {
  args: {
    value: sampleSQLCode,
    height: '500px',
    language: 'pgsql',
    variant: 'bordered'
  }
};

export const EmptyEditor: Story = {
  args: {
    height: '200px',
    language: 'pgsql',
    variant: 'bordered'
  }
};

export const ChatConfigDemo: Story = {
  args: {
    ...Default.args,
    value: `name: Sales Breakdown by Category
description: Pie Chart breaking down sales by product category over the last 12 months.
timeFrame: Last 12 months
sql: |
  SELECT p.product_category, SUM(o.line_total) AS total_sales
  FROM sem.entity_sales_order o
  JOIN sem.entity_product p ON o.fk_product = p.product_id
  WHERE o.order_date >= (CURRENT_DATE - INTERVAL '12 months')
  GROUP BY p.product_category
  ORDER BY total_sales DESC
chartConfig:
  selectedChartType: pie
  columnLabelFormats:
    total_sales:
      columnType: number
      style: number
      displayName: ''
      numberSeparatorStyle: ','
      minimumFractionDigits: 0
      maximumFractionDigits: 2
      multiplier: 1.0
      prefix: ''
      suffix: ''
      replaceMissingDataWith: null
      compactNumbers: false
      currency: USD
      dateFormat: auto
      useRelativeTime: false
    product_category:
      columnType: string
      style: string
      displayName: ''
      numberSeparatorStyle: ','
      minimumFractionDigits: 0
      maximumFractionDigits: 2
      multiplier: 1.0
      prefix: ''
      suffix: ''
      replaceMissingDataWith: null
      compactNumbers: false
      currency: USD
      dateFormat: auto
      useRelativeTime: false
  columnSettings:
    total_sales:
      showDataLabels: false
      showDataLabelsAsPercentage: false
      columnVisualization: bar
      lineWidth: 2.0
      lineStyle: line
      lineType: normal
      lineSymbolSize: 0.0
      barRoundness: 8.0
    product_category:
      showDataLabels: false
      showDataLabelsAsPercentage: false
      columnVisualization: bar
      lineWidth: 2.0
      lineStyle: line
      lineType: normal
      lineSymbolSize: 0.0
      barRoundness: 8.0
  colors:
  - '#B399FD'
  - '#FC8497'
  - '#FBBC30'
  - '#279EFF'
  - '#E83562'
  - '#41F8FF'
  - '#F3864F'
  - '#C82184'
  - '#31FCB4'
  - '#E83562'
  gridLines: true
  showLegendHeadline: false
  goalLines: []
  trendlines: []
  disableTooltip: false
  pieChartAxis:
    x:
    - product_category
    y:
    - total_sales
    tooltip: []
  pieDisplayLabelAs: number
  pieShowInnerLabel: true
  pieInnerLabelAggregate: sum
  pieInnerLabelTitle: Total
  pieDonutWidth: 40.0
  pieMinimumSlicePercentage: 0.0
datasetIds:
- e9d9b89e-d070-4bea-8f28-65045c84e7e1
- 9fa460b4-1410-4e74-aa34-eb79027cd59c
`
  }
};
