import type { ColumnLabelFormat, Trendline } from '@buster/server-shared/metrics';
import {
  type BarAndLineAxis,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
} from '@buster/server-shared/metrics';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { generateBarChartData } from '../../../../mocks/chart/chartMocks';
import { BusterChart } from '../BusterChart';
import { sharedMeta } from './BusterChartShared';

// Helper functions for predictable data generation
const generateProductName = (index: number) => `Product ${index + 1}`;
const generateDepartment = (index: number) => {
  const departments = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'];
  return departments[index % departments.length];
};
const generateState = (index: number) => {
  const states = ['California', 'Texas', 'New York', 'Florida', 'Illinois'];
  return states[index % states.length];
};
const generateNumber = (base: number, variance: number, index: number) => {
  // Use index to create predictable but varying numbers
  const noise = Math.sin(index) * variance;
  return Math.round(base + noise);
};
const generateDate = (index: number) => {
  const baseDate = new Date('2024-01-01');
  baseDate.setDate(baseDate.getDate() - index);
  return baseDate.toISOString();
};

const generateRegion = (index: number) => {
  const regions = [
    'North',
    'South',
    'East',
    'West',
    'Central',
    'Southeast',
    'Southwest',
    'Northeast',
  ];
  return regions[index % regions.length];
};

type BarChartData = ReturnType<typeof generateBarChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Bar',
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: 'bar',
    data: generateBarChartData(),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units', 'returns'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        displayName: 'SALES',
      } as ColumnLabelFormat,
      units: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      category: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat as any,
    } as any,
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const MultipleYAxis: Story = {
  args: {
    selectedChartType: 'bar',
    data: generateBarChartData(),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units'],
      category: [],
      tooltip: null,
    } satisfies BarAndLineAxis,
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    } as any,
    y2AxisShowAxisLabel: true,
    y2AxisShowAxisTitle: true,
    y2AxisAxisTitle: 'Returns',
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithCategory: Story = {
  args: {
    selectedChartType: 'bar',
    data: [
      {
        region: 'North',
        product: 'Product 1',
        sales: 1000,
      },
      {
        region: 'North',
        product: 'Product 2',
        sales: 800,
      },
      {
        region: 'North',
        product: 'Product 3',
        sales: 820,
      },
      {
        region: 'South',
        product: 'Product 1',
        sales: 1200,
      },
      {
        region: 'South',
        product: 'Product 2',
        sales: 300,
      },
      {
        region: 'South',
        product: 'Product 3',
        sales: 220,
      },
      {
        region: 'East',
        product: 'Product 1',
        sales: 1000,
      },
      {
        region: 'East',
        product: 'Product 2',
        sales: 800,
      },
      {
        region: 'East',
        product: 'Product 3',
        sales: 920,
      },
    ],
    barAndLineAxis: {
      x: ['region'],
      y: ['sales'],
      category: ['product'],
      tooltip: null,
    },
    columnLabelFormats: {
      region: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithCategoryAndMultipleYAxis: Story = {
  args: {
    selectedChartType: 'bar',
    data: Array.from({ length: 4 }, (_, index) => ({
      region: generateRegion(index),
      product: generateProductName(index),
      sales: generateNumber(5000, 1000, index),
      units: generateNumber(500, 100, index),
    })),
    barAndLineAxis: {
      x: ['region'],
      y: ['sales', 'units'],
      category: ['product'],
      tooltip: null,
    },
    columnLabelFormats: {
      region: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const DateXAxis: Story = {
  args: {
    selectedChartType: 'bar',
    data: Array.from({ length: 7 }, (_, index) => {
      const date = new Date('2024-01-01');
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString(),
        sales: generateNumber(5000, 1000, index),
        units: generateNumber(500, 100, index),
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['sales', 'units'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
    xAxisTimeInterval: 'day',
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const HorizontalBar: Story = {
  args: {
    selectedChartType: 'bar',
    data: generateBarChartData(4),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
    barLayout: 'horizontal',
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithDataLabels: Story = {
  args: {
    selectedChartType: 'bar',
    data: generateBarChartData(4),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units'],
      category: [],
      tooltip: null,
    },
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
        showDataLabelsAsPercentage: false,
      },
      units: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
        showDataLabelsAsPercentage: false,
      },
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithDataLabelsAndStackTotal: Story = {
  args: {
    selectedChartType: 'bar',
    data: generateBarChartData(4),
    barAndLineAxis: {
      x: ['category'],
      y: ['units', 'sales'],
      category: [],
      tooltip: null,
    },
    barGroupType: 'stack',
    barShowTotalAtTop: true,
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
        showDataLabelsAsPercentage: false,
      },
      units: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
        showDataLabelsAsPercentage: false,
      },
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithDataLabelAsPercentageInStackedBar: Story = {
  args: {
    ...WithDataLabelsAndStackTotal.args,
    data: [
      { category: 'Cat 1', sales: 3000, units: 3000, returns: 100 },
      { category: 'Cat 2', sales: 10000, units: 1000, returns: 100 },
      { category: 'Cat 3', sales: 8000, units: 1900, returns: 100 },
    ],
    barGroupType: 'stack',
    columnSettings: {
      ...WithDataLabelsAndStackTotal.args!.columnSettings,
      units: {
        ...DEFAULT_COLUMN_SETTINGS,
        ...WithDataLabelsAndStackTotal.args!.columnSettings!.units,
        showDataLabelsAsPercentage: true,
      },
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        ...WithDataLabelsAndStackTotal.args!.columnSettings!.sales,
        showDataLabelsAsPercentage: false,
      },
    },
  },
};

export const WithDataLabelAsPercentageInGroupedBar: Story = {
  args: {
    ...WithDataLabelAsPercentageInStackedBar.args,
    barGroupType: 'group',
    barShowTotalAtTop: false,
  },
};

export const WithDataLabelAndPercentageStackedBar: Story = {
  args: {
    ...WithDataLabelAsPercentageInStackedBar.args,
    barGroupType: 'percentage-stack',
    barShowTotalAtTop: false,
  },
};

export const LargeDataset: Story = {
  args: {
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
    selectedChartType: 'bar',
    data: Array.from({ length: 25 }, (_, index) => ({
      category: generateProductName(index),
      sales: generateNumber(25000, 5000, index),
      units: generateNumber(500, 100, index),
      returns: generateNumber(500, 100, index),
    })),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units', 'returns'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const LargeDatasetWithDualYAxis: Story = {
  args: {
    selectedChartType: 'combo',
    data: Array.from({ length: 25 }, (_, index) => ({
      category: generateProductName(index),
      sales: generateNumber(25000, 5000, index),
      units: generateNumber(500, 100, index),
      returns: generateNumber(500, 100, index),
    })),
    comboChartAxis: {
      x: ['category'],
      y: ['sales', 'returns'],
      y2: ['units'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const WithSorting: Story = {
  args: {
    ...Default.args,
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    barSortBy: ['asc'],
  },
};

export const WithDatesInXAxis: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 7 }, (_, index) => ({
      date: generateDate(index),
      sales: generateNumber(5000, 1000, index),
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const WithDatesInXAxisAndSorting: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 7 }, (_, index) => ({
      date: generateDate(index),
      sales: generateNumber(5000, 1000, index),
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    barSortBy: ['asc'],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const HorizontalBarWithGoalLine: Story = {
  args: {
    selectedChartType: 'bar',
    data: [
      { category: 'Cat 1', sales: 4000, units: 1000, returns: 100 },
      { category: 'Cat 2', sales: 10000, units: 1000, returns: 100 },
      { category: 'Cat 3', sales: 8000, units: 1000, returns: 100 },
    ],
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
    barLayout: 'horizontal',
    goalLines: [
      {
        show: true,
        value: 7500,
        showGoalLineLabel: true,
        goalLineLabel: 'Target Sales',
        goalLineColor: '#FF6B6B',
      },
    ],
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const GroupedBar: Story = {
  args: {
    selectedChartType: 'bar',
    data: ['Electronics', 'Clothing', 'Home', 'Books'].flatMap((category, index) => {
      const states = ['Utah', 'Arizona', 'Idaho', 'Wyoming'];
      return states.map((state, index2) => {
        return {
          region: state,
          product: category,
          sales:
            generateNumber(5000, 1000, index) *
            (index + 1.23) *
            (index2 + 1.23) *
            (1 + Math.cos(index * 0.5) * 0.3 + Math.sin(index2 * 0.7) * 0.2),
          units: generateNumber(250, 50, index) * (index + 1.13) * (index2 + 1.03),
          returns: generateNumber(50, 10, index) * (index + 1.83) * (index2 + 1.93),
        };
      });
    }),
    barAndLineAxis: {
      x: ['region'],
      y: ['sales'],
      category: ['product'],
      tooltip: null,
    },
    barGroupType: 'group',
    columnLabelFormats: {
      region: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const PercentageStackedBar: Story = {
  args: {
    selectedChartType: 'bar',
    data: ['Electronics', 'Clothing', 'Home', 'Books'].flatMap((category, index) => {
      const states = ['Utah', 'Arizona', 'Idaho', 'Wyoming'];
      return states.map((state, index2) => {
        return {
          region: state,
          product: category,
          sales:
            generateNumber(5000, 1000, index) *
            (index + 1.23) *
            (index2 + 1.23) *
            (1 + Math.cos(index * 0.15) * 0.3 + Math.sin(index2 * 0.15) * 0.2),
          units: generateNumber(250, 50, index) * (index + 1.13) * (index2 + 1.03),
          returns: generateNumber(50, 10, index) * (index + 1.83) * (index2 + 1.93),
        };
      });
    }),
    barAndLineAxis: {
      x: ['region'],
      y: ['sales'],
      category: ['product'],
      tooltip: null,
    },
    barGroupType: 'percentage-stack',
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
      },
      units: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
      },
      returns: {
        ...DEFAULT_COLUMN_SETTINGS,
        showDataLabels: true,
      },
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[300px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const ExtraLargeDataset: Story = {
  args: {
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
    selectedChartType: 'bar',
    data: Array.from({ length: 500 }, (_, index) => ({
      category: generateProductName(index),
      sales: generateNumber(25000, 5000, index),
      units: generateNumber(500, 100, index),
    })),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const ExtraLargeDatasetWithCategory: Story = {
  args: {
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
    selectedChartType: 'bar',
    data: Array.from({ length: 5000 }, (_, index) => ({
      product: generateProductName(index),
      sales: generateNumber(25000, 5000, index),
      units: generateNumber(500, 100, index),
      category: generateDepartment(index),
    })),
    barAndLineAxis: {
      x: ['product'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[400px]">
        <BusterChart {...args} />
      </div>
    );
  },
};

export const ManyUnPlottedTooltipItems: Story = {
  args: {
    selectedChartType: 'bar',
    data: Array.from({ length: 12 }, (_, index) => ({
      category: generateProductName(index),
      sales: generateNumber(25000, 5000, index),
      customerRating: generateNumber(3.5, 1, index),
      stockLevel: generateNumber(50, 10, index),
      returnRate: generateNumber(1, 15, index),
    })),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: ['sales', 'customerRating', 'stockLevel', 'returnRate'],
    },
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar',
      },
      customerRating: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 2,
      },
      stockLevel: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2,
      },
      returnRate: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2,
      },
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      customerRating: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' ★',
      } as ColumnLabelFormat,
      stockLevel: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' units',
      } as ColumnLabelFormat,
      returnRate: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: '%',
      } as ColumnLabelFormat,
    },
    yAxisAxisTitle: 'Sales Revenue',
    y2AxisAxisTitle: 'Multiple Metrics',
    gridLines: true,
    showLegend: true,
    className: 'w-[600px] h-[400px]',
  },
};

export const WithLegendHeadline: Story = {
  args: {
    ...Default.args,
    pieDisplayLabelAs: 'number',
    showLegend: true,
    showLegendHeadline: 'average',
    columnLabelFormats: {
      ...Default.args!.columnLabelFormats,
      sales: {
        ...Default.args!.columnLabelFormats!.sales!,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithLegendHeadlineMultipleYAxis: Story = {
  args: {
    ...MultipleYAxis.args,
    showLegend: true,
    showLegendHeadline: 'current',
  },
};

export const WithMultipleXAxis: Story = {
  args: {
    ...Default.args,
    data: [
      {
        month: 'January',
        year: 2023,
        sales: 13000,
      },
      {
        month: 'February',
        year: 2023,
        sales: 14000,
      },
      {
        month: 'January',
        year: 2024,
        sales: 10000,
      },
      {
        month: 'February',
        year: 2024,
        sales: 20000,
      },
    ],
    barAndLineAxis: {
      x: ['month', 'year'],
      y: ['sales'],
      category: [],
      tooltip: null,
    } satisfies BarAndLineAxis,
  },
};

export const WithGoalLinesSimilar: Story = {
  args: {
    ...Default.args,
    barAndLineAxis: {
      ...Default.args!.barAndLineAxis!,
      y: ['sales', 'units'],
    },
    columnLabelFormats: {
      ...Default.args!.columnLabelFormats,
      sales: {
        ...Default.args!.columnLabelFormats!.sales!,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
      units: {
        ...Default.args!.columnLabelFormats!.units!,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
    goalLines: [
      {
        show: true,
        value: 7500,
        showGoalLineLabel: true,
        goalLineLabel: 'Target Sales',
        goalLineColor: '#FF6B6B',
      },
    ],
  },
};

export const WithGoalLinesNotSimilar: Story = {
  args: {
    ...Default.args,
    goalLines: [
      {
        show: true,
        value: 7500,
        showGoalLineLabel: true,
        goalLineLabel: 'Target Sales',
        goalLineColor: '#FF6B6B',
      },
    ],
  },
};

export const WithTrendlines: Story = {
  args: {
    ...Default.args,
    trendlines: [
      {
        type: 'max',
        show: true,
        showTrendlineLabel: false,
        trendlineLabel: 'Testing Max',
        trendLineColor: 'red',
        columnId: 'sales',
      } as Trendline,
      {
        type: 'min',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Min',
        trendLineColor: 'blue',
        columnId: 'sales',
      } as Trendline,
      {
        type: 'average',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Average',
        trendLineColor: 'green',
        columnId: 'sales',
      } as Trendline,
      {
        type: 'median',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Median',
        trendLineColor: 'yellow',
        columnId: 'sales',
      } as Trendline,
    ],
  },
};

//IT got the x and y axis mixed up... which is fair...
export const ProblematicBarChart: Story = {
  args: {
    selectedChartType: 'bar',
    barLayout: 'horizontal',
    barAndLineAxis: {
      x: ['metric_clv_all_time'],
      y: ['customer_name'],
      category: [],
      tooltip: null,
    },
    columnLabelFormats: {
      customer_name: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      },
      metric_clv_all_time: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        numberSeparatorStyle: ',',
        replaceMissingDataWith: 0,
        currency: 'USD',
      },
    },
    data: [
      {
        customer_name: 'Customer A',
        metric_clv_all_time: 800000.0,
      },
      {
        customer_name: 'Customer B',
        metric_clv_all_time: 780000.0,
      },
      {
        customer_name: 'Customer C',
        metric_clv_all_time: 760000.0,
      },
      {
        customer_name: 'Customer D',
        metric_clv_all_time: 740000.0,
      },
      {
        customer_name: 'Customer E',
        metric_clv_all_time: 720000.0,
      },
      {
        customer_name: 'Customer F',
        metric_clv_all_time: 700000.0,
      },
      {
        customer_name: 'Customer G',
        metric_clv_all_time: 680000.0,
      },
      {
        customer_name: 'Customer H',
        metric_clv_all_time: 660000.0,
      },
      {
        customer_name: 'Customer I',
        metric_clv_all_time: 640000.0,
      },
      {
        customer_name: 'Customer J',
        metric_clv_all_time: 620000.0,
      },
    ],
  },
};

export const WithYearInXAxis: Story = {
  args: {
    ...Default.args,
    barAndLineAxis: {
      ...Default.args!.barAndLineAxis!,
      x: ['year'],
    },
    data: Array.from({ length: 7 }, (_, index) => ({
      year: 2015 + index,
      sales: generateNumber(5000, 1000, index),
    })),
    columnLabelFormats: {
      year: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: null,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const BarChartWithProblemData: Story = {
  args: {
    barLayout: 'vertical',
    barGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['customer_motivation'],
      y: ['percentage_within_motivation'],
      category: ['category_name'],
      tooltip: null,
    },
    columnSettings: {
      category_name: {
        lineType: 'normal',
        lineStyle: 'line',
        lineWidth: 2,
        barRoundness: 8,
        lineSymbolSize: 0,
        showDataLabels: false,
        columnVisualization: 'bar',
        showDataLabelsAsPercentage: false,
      },
      purchase_count: {
        lineType: 'normal',
        lineStyle: 'line',
        lineWidth: 2,
        barRoundness: 8,
        lineSymbolSize: 0,
        showDataLabels: false,
        columnVisualization: 'bar',
        showDataLabelsAsPercentage: false,
      },
      customer_motivation: {
        lineType: 'normal',
        lineStyle: 'line',
        lineWidth: 2,
        barRoundness: 8,
        lineSymbolSize: 0,
        showDataLabels: false,
        columnVisualization: 'bar',
        showDataLabelsAsPercentage: false,
      },
      percentage_within_motivation: {
        lineType: 'normal',
        lineStyle: 'line',
        lineWidth: 2,
        barRoundness: 8,
        lineSymbolSize: 0,
        showDataLabels: false,
        columnVisualization: 'bar',
        showDataLabelsAsPercentage: false,
      },
    },
    disableTooltip: false,
    yAxisScaleType: 'linear',
    y2AxisScaleType: 'linear',
    barShowTotalAtTop: false,
    selectedChartType: 'bar',
    columnLabelFormats: {
      category_name: {
        style: 'string',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'text',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        replaceMissingDataWith: null,
      } as ColumnLabelFormat,
      purchase_count: {
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: true,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        replaceMissingDataWith: 0,
      } as ColumnLabelFormat,
      customer_motivation: {
        style: 'string',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'text',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        replaceMissingDataWith: null,
      } as ColumnLabelFormat,
      percentage_within_motivation: {
        style: 'percent',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        replaceMissingDataWith: 0,
      } as ColumnLabelFormat,
    },
    showLegendHeadline: false,
    xAxisLabelRotation: 'auto',
    xAxisShowAxisLabel: true,
    xAxisShowAxisTitle: true,
    yAxisShowAxisLabel: true,
    yAxisShowAxisTitle: true,
    y2AxisShowAxisLabel: true,
    y2AxisShowAxisTitle: true,
    y2AxisStartAxisAtZero: true,
    data: [
      {
        customer_motivation: 'Recreation',
        category_name: 'Accessories',
        purchase_count: 33143,
        percentage_within_motivation: 67.31,
      },
      {
        customer_motivation: 'Recreation',
        category_name: 'Bikes',
        purchase_count: 8427,
        percentage_within_motivation: 17.11,
      },
      {
        customer_motivation: 'Recreation',
        category_name: 'Clothing',
        purchase_count: 7321,
        percentage_within_motivation: 14.87,
      },
      {
        customer_motivation: 'Recreation',
        category_name: 'Components',
        purchase_count: 350,
        percentage_within_motivation: 0.71,
      },
      {
        customer_motivation: 'Transportation',
        category_name: 'Bikes',
        purchase_count: 4433,
        percentage_within_motivation: 71.88,
      },
      {
        customer_motivation: 'Transportation',
        category_name: 'Clothing',
        purchase_count: 1615,
        percentage_within_motivation: 26.19,
      },
      {
        customer_motivation: 'Transportation',
        category_name: 'Components',
        purchase_count: 119,
        percentage_within_motivation: 1.93,
      },
    ],
    columnMetadata: [
      {
        name: 'customer_motivation',
        min_value: 'Recreation',
        max_value: 'Transportation',
        unique_values: 2,
        simple_type: 'text',
        type: 'text',
      },
      {
        name: 'category_name',
        min_value: 'Accessories',
        max_value: 'Components',
        unique_values: 4,
        simple_type: 'text',
        type: 'text',
      },
      {
        name: 'purchase_count',
        min_value: 119,
        max_value: 33143,
        unique_values: 7,
        simple_type: 'number',
        type: 'int8',
      },
      {
        name: 'percentage_within_motivation',
        min_value: 0.71,
        max_value: 71.88,
        unique_values: 7,
        simple_type: 'number',
        type: 'numeric',
      },
    ],
  },
};
