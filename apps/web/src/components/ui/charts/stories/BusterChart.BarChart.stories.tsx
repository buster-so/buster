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
      colorBy: [],
    },
    columnLabelFormats: {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        displayName: 'Sales',
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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
      colorBy: [],
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

export const WithColorByXAxis: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    data: [
      {
        sales: 1000,
        type: 'Type 1',
        level: 'Level 1',
      },
      {
        sales: 2000,
        type: 'Type 2',
        level: 'Level 2',
      },
      {
        sales: 1200,
        type: 'Type 3',
        level: 'Level 1',
      },
    ],
    barAndLineAxis: {
      x: ['type'],
      y: ['sales'],
      category: [],
      tooltip: null,
      colorBy: ['level'],
    },
  },
};

export const WithColorBy: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    data: [
      {
        sales: 1000,
        type: 'Type 1',
        level: 'Level 1',
      },
      {
        sales: 2000,
        type: 'Type 2',
        level: 'Level 2',
      },
      {
        sales: 1200,
        type: 'Type 3',
        level: 'Level 1',
      },
      {
        sales: 1500,
        type: 'Type 4',
        level: 'Level 1',
      },
      {
        sales: 1500,
        type: 'Type 5',
        level: 'Level 3',
      },
      {
        sales: 900,
        type: 'Type 6',
        level: 'Level 4',
      },
    ],
    barAndLineAxis: {
      x: ['type'],
      y: ['sales'],
      category: [],
      tooltip: null,
      colorBy: ['level'],
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
      colorBy: [],
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

export const BarChartWithSortedDayOfWeek: Story = {
  args: {
    colors: [
      '#B399FD',
      '#FC8497',
      '#FBBC30',
      '#279EFF',
      '#E83562',
      '#41F8FF',
      '#F3864F',
      '#C82184',
      '#31FCB4',
      '#E83562',
    ],
    barLayout: 'vertical',
    barSortBy: ['desc'],
    goalLines: [],
    gridLines: true,
    trendlines: [],
    barGroupType: 'group',
    xAxisDataZoom: false,
    barAndLineAxis: {
      x: ['day_of_week'],
      y: ['message_count'],
      category: [],
      tooltip: null,
      colorBy: [],
    },
    columnSettings: {
      day_of_week: {
        lineType: 'normal',
        lineStyle: 'line',
        lineWidth: 2,
        barRoundness: 8,
        lineSymbolSize: 0,
        showDataLabels: false,
        columnVisualization: 'bar',
        showDataLabelsAsPercentage: false,
      },
      message_count: {
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
      day_of_week: {
        style: 'date',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Day of Week',
        compactNumbers: false,
        convertNumberTo: 'day_of_week',
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        replaceMissingDataWith: null,
      } as ColumnLabelFormat,
      message_count: {
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Messages Sent',
        compactNumbers: false,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
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
    columnMetadata: [
      {
        name: 'day_of_week',
        min_value: 0,
        max_value: 6,
        unique_values: 7,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'message_count',
        min_value: 2,
        max_value: 140,
        unique_values: 7,
        simple_type: 'number',
        type: 'int8',
      },
    ],
    data: [
      {
        day_of_week: 0,
        message_count: 2,
      },
      {
        day_of_week: 1,
        message_count: 127,
      },
      {
        day_of_week: 2,
        message_count: 119,
      },
      {
        day_of_week: 3,
        message_count: 140,
      },
      {
        day_of_week: 4,
        message_count: 122,
      },
      {
        day_of_week: 5,
        message_count: 106,
      },
      {
        day_of_week: 6,
        message_count: 5,
      },
    ],
  },
};

export const BarWithProblemQuarters: Story = {
  args: {
    colors: [
      '#B399FD',
      '#FC8497',
      '#FBBC30',
      '#279EFF',
      '#E83562',
      '#41F8FF',
      '#F3864F',
      '#C82184',
      '#31FCB4',
      '#E83562',
    ],
    barLayout: 'vertical',
    barSortBy: [],
    goalLines: [],
    gridLines: true,
    pieSortBy: 'value',
    showLegend: null,
    trendlines: [],
    scatterAxis: {
      x: [],
      y: [],
      size: [],
      tooltip: null,
      category: [],
    },
    barGroupType: 'stack',
    metricHeader: null,
    pieChartAxis: {
      x: [],
      y: [],
      tooltip: null,
    },
    lineGroupType: null,
    pieDonutWidth: 40,
    xAxisDataZoom: false,
    barAndLineAxis: {
      x: ['quarter'],
      y: ['product_count'],
      colorBy: [],
      tooltip: null,
      category: ['metric_seasoncategory'],
    },
    columnSettings: {},
    comboChartAxis: {
      x: [],
      y: [],
      y2: [],
      colorBy: [],
      tooltip: null,
      category: [],
    },
    disableTooltip: false,
    metricColumnId: '',
    scatterDotSize: [3, 15],
    xAxisAxisTitle: null,
    yAxisAxisTitle: null,
    yAxisScaleType: 'linear',
    metricSubHeader: null,
    y2AxisAxisTitle: null,
    y2AxisScaleType: 'linear',
    metricValueLabel: null,
    pieLabelPosition: 'none',
    tableColumnOrder: null,
    barShowTotalAtTop: false,
    categoryAxisTitle: null,
    pieDisplayLabelAs: 'number',
    pieShowInnerLabel: true,
    selectedChartType: 'bar',
    tableColumnWidths: null,
    xAxisTimeInterval: null,
    columnLabelFormats: {
      quarter: {
        isUTC: false,
        style: 'date',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        convertNumberTo: 'quarter',
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      product_count: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Product Count',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      metric_seasoncategory: {
        isUTC: false,
        style: 'string',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'text',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Season Category',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: null,
      },
    },
    pieInnerLabelTitle: null,
    showLegendHeadline: false,
    xAxisLabelRotation: 'auto',
    xAxisShowAxisLabel: true,
    xAxisShowAxisTitle: true,
    yAxisShowAxisLabel: true,
    yAxisShowAxisTitle: true,
    y2AxisShowAxisLabel: true,
    y2AxisShowAxisTitle: true,
    metricValueAggregate: 'sum',
    tableColumnFontColor: null,
    tableHeaderFontColor: null,
    yAxisStartAxisAtZero: null,
    y2AxisStartAxisAtZero: true,
    pieInnerLabelAggregate: 'sum',
    pieMinimumSlicePercentage: 0,
    tableHeaderBackgroundColor: null,
    data: [
      {
        quarter: 1,
        metric_seasoncategory: 'High Season',
        product_count: 55,
      },
      {
        quarter: 1,
        metric_seasoncategory: 'Low Season',
        product_count: 18,
      },
      {
        quarter: 1,
        metric_seasoncategory: 'Regular Season',
        product_count: 174,
      },
      {
        quarter: 2,
        metric_seasoncategory: 'High Season',
        product_count: 27,
      },
      {
        quarter: 2,
        metric_seasoncategory: 'Low Season',
        product_count: 60,
      },
      {
        quarter: 2,
        metric_seasoncategory: 'Regular Season',
        product_count: 156,
      },
      {
        quarter: 3,
        metric_seasoncategory: 'High Season',
        product_count: 2,
      },
      {
        quarter: 3,
        metric_seasoncategory: 'Low Season',
        product_count: 181,
      },
      {
        quarter: 3,
        metric_seasoncategory: 'Regular Season',
        product_count: 82,
      },
      {
        quarter: 4,
        metric_seasoncategory: 'High Season',
        product_count: 136,
      },
      {
        quarter: 4,
        metric_seasoncategory: 'Low Season',
        product_count: 22,
      },
      {
        quarter: 4,
        metric_seasoncategory: 'Regular Season',
        product_count: 108,
      },
    ],
    columnMetadata: [
      {
        name: 'quarter',
        min_value: 1,
        max_value: 4,
        unique_values: 4,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'metric_seasoncategory',
        min_value: 'High Season',
        max_value: 'Regular Season',
        unique_values: 3,
        simple_type: 'text',
        type: 'text',
      },
      {
        name: 'product_count',
        min_value: 2,
        max_value: 181,
        unique_values: 12,
        simple_type: 'number',
        type: 'int8',
      },
    ],
  },
};

export const BarChatWithProblemDates: Story = {
  decorators: [
    (Story) => {
      return (
        <div style={{ width: '650px', height: '100%' }}>
          <Story />
        </div>
      );
    },
  ],
  args: {
    className: 'w-[650px] h-[400px]',
    colors: [
      '#B399FD',
      '#FC8497',
      '#FBBC30',
      '#279EFF',
      '#E83562',
      '#41F8FF',
      '#F3864F',
      '#C82184',
      '#31FCB4',
      '#E83562',
    ],
    barLayout: 'vertical',
    barSortBy: [],
    goalLines: [],
    gridLines: true,
    pieSortBy: 'value',
    showLegend: null,
    trendlines: [],
    scatterAxis: {
      x: [],
      y: [],
      size: [],
      tooltip: null,
      category: [],
    },
    barGroupType: 'group',
    metricHeader: null,
    pieChartAxis: {
      x: [],
      y: [],
      tooltip: null,
    },
    lineGroupType: null,
    pieDonutWidth: 40,
    xAxisDataZoom: false,
    barAndLineAxis: {
      x: ['time_stamp'],
      y: ['watch_time'],
      colorBy: [],
      tooltip: null,
      category: [],
    },
    columnSettings: {},
    comboChartAxis: {
      x: [],
      y: [],
      y2: [],
      colorBy: [],
      tooltip: null,
      category: [],
    },
    disableTooltip: false,
    metricColumnId: '',
    scatterDotSize: [3, 15],
    xAxisAxisTitle: null,
    yAxisAxisTitle: null,
    yAxisScaleType: 'linear',
    metricSubHeader: null,
    y2AxisAxisTitle: null,
    y2AxisScaleType: 'linear',
    metricValueLabel: null,
    pieLabelPosition: 'none',
    tableColumnOrder: null,
    barShowTotalAtTop: false,
    categoryAxisTitle: null,
    pieDisplayLabelAs: 'number',
    pieShowInnerLabel: true,
    selectedChartType: 'bar',
    tableColumnWidths: null,
    xAxisTimeInterval: null,
    columnLabelFormats: {
      watch_time: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'New Hours Added',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      time_stamp: {
        isUTC: true,
        style: 'date',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'date',
        dateFormat: 'MMM YYYY',
        multiplier: 1,
        displayName: 'Month',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: null,
      },
    },
    pieInnerLabelTitle: null,
    showLegendHeadline: false,
    xAxisLabelRotation: 'auto',
    xAxisShowAxisLabel: true,
    xAxisShowAxisTitle: true,
    yAxisShowAxisLabel: true,
    yAxisShowAxisTitle: true,
    y2AxisShowAxisLabel: true,
    y2AxisShowAxisTitle: true,
    metricValueAggregate: 'sum',
    tableColumnFontColor: null,
    tableHeaderFontColor: null,
    yAxisStartAxisAtZero: null,
    y2AxisStartAxisAtZero: true,
    pieInnerLabelAggregate: 'sum',
    pieMinimumSlicePercentage: 0,
    tableHeaderBackgroundColor: null,
    data: [
      {
        time_stamp: '2022-06-01T00:00:00.000Z',
        watch_time: 30.706111,
      },
      {
        time_stamp: '2022-07-01T00:00:00.000Z',
        watch_time: 4.4875,
      },
      {
        time_stamp: '2022-09-01T00:00:00.000Z',
        watch_time: 5.646944,
      },
      {
        time_stamp: '2022-10-01T00:00:00.000Z',
        watch_time: 7.295,
      },
      {
        time_stamp: '2022-11-01T00:00:00.000Z',
        watch_time: 22.980556,
      },
      {
        time_stamp: '2022-12-01T00:00:00.000Z',
        watch_time: 3.955833,
      },
      {
        time_stamp: '2023-01-01T00:00:00.000Z',
        watch_time: 3.107778,
      },
      {
        time_stamp: '2023-02-01T00:00:00.000Z',
        watch_time: 6.12,
      },
      {
        time_stamp: '2023-03-01T00:00:00.000Z',
        watch_time: 5.703611,
      },
      {
        time_stamp: '2023-04-01T00:00:00.000Z',
        watch_time: 6.83,
      },
      {
        time_stamp: '2023-05-01T00:00:00.000Z',
        watch_time: 9.665278,
      },
      {
        time_stamp: '2023-06-01T00:00:00.000Z',
        watch_time: 6.590278,
      },
      {
        time_stamp: '2023-07-01T00:00:00.000Z',
        watch_time: 6.13,
      },
      {
        time_stamp: '2023-08-01T00:00:00.000Z',
        watch_time: 5.546667,
      },
      {
        time_stamp: '2023-09-01T00:00:00.000Z',
        watch_time: 5.541667,
      },
      {
        time_stamp: '2023-10-01T00:00:00.000Z',
        watch_time: 7.720278,
      },
      {
        time_stamp: '2023-11-01T00:00:00.000Z',
        watch_time: 7.246111,
      },
      {
        time_stamp: '2023-12-01T00:00:00.000Z',
        watch_time: 6.724167,
      },
      {
        time_stamp: '2024-01-01T00:00:00.000Z',
        watch_time: 0.734722,
      },
      {
        time_stamp: '2024-02-01T00:00:00.000Z',
        watch_time: 3.892222,
      },
      {
        time_stamp: '2024-03-01T00:00:00.000Z',
        watch_time: 5.255,
      },
      {
        time_stamp: '2024-04-01T00:00:00.000Z',
        watch_time: 4.281389,
      },
      {
        time_stamp: '2024-05-01T00:00:00.000Z',
        watch_time: 1.8425,
      },
      {
        time_stamp: '2024-06-01T00:00:00.000Z',
        watch_time: 9.715278,
      },
      {
        time_stamp: '2024-07-01T00:00:00.000Z',
        watch_time: 4.211111,
      },
      {
        time_stamp: '2024-08-01T00:00:00.000Z',
        watch_time: 9.561111,
      },
      {
        time_stamp: '2024-09-01T00:00:00.000Z',
        watch_time: 6.538611,
      },
      {
        time_stamp: '2024-10-01T00:00:00.000Z',
        watch_time: 4.194444,
      },
      {
        time_stamp: '2024-11-01T00:00:00.000Z',
        watch_time: 2.588056,
      },
      {
        time_stamp: '2024-12-01T00:00:00.000Z',
        watch_time: 8.929167,
      },
      {
        time_stamp: '2025-01-01T00:00:00.000Z',
        watch_time: 3.890833,
      },
      {
        time_stamp: '2025-02-01T00:00:00.000Z',
        watch_time: 7.061389,
      },
      {
        time_stamp: '2025-03-01T00:00:00.000Z',
        watch_time: 8.763611,
      },
      {
        time_stamp: '2025-06-01T00:00:00.000Z',
        watch_time: 0.795556,
      },
      {
        time_stamp: '2025-08-01T00:00:00.000Z',
        watch_time: 2.926667,
      },
      {
        time_stamp: '2025-09-01T00:00:00.000Z',
        watch_time: 1.993889,
      },
      {
        time_stamp: '2025-10-01T00:00:00.000Z',
        watch_time: 1.566667,
      },
    ],
    columnMetadata: [
      {
        name: 'time_stamp',
        min_value: '2022-06-01T00:00:00.000Z',
        max_value: '2025-10-01T00:00:00.000Z',
        unique_values: 37,
        simple_type: 'date',
        type: 'timestamptz',
      },
      {
        name: 'watch_time',
        min_value: 0.734722,
        max_value: 30.706111,
        unique_values: 37,
        simple_type: 'number',
        type: 'numeric',
      },
    ],
  },
};

export const PercentageValueScaleBar: Story = {
  args: {
    selectedChartType: 'bar',
    barGroupType: 'stack',
    barLayout: 'vertical',
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
      category: [],
      tooltip: null,
      colorBy: [],
    },
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
      },
      category: {
        ...DEFAULT_COLUMN_SETTINGS,
      },
    },
    columnLabelFormats: {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'percent',
      },
      category: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      },
    },
    data: [
      {
        category: 'Electronics',
        sales: 55.67,
      },
      {
        category: 'Clothing',
        sales: 34.33,
      },
    ],
    columnMetadata: [
      {
        name: 'category',
        min_value: 'Electronics',
        max_value: 'Clothing',
        unique_values: 2,
        simple_type: 'text',
        type: 'text',
      },
      {
        name: 'sales',
        min_value: 34.33,
        max_value: 55.67,
        unique_values: 2,
        simple_type: 'number',
        type: 'numeric',
      },
    ],
  },
};
