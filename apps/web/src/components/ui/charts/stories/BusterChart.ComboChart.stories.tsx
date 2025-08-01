import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import type { BusterChart } from '../BusterChart';
import { sharedMeta } from './BusterChartShared';
import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  type ColumnLabelFormat
} from '@buster/server-shared/metrics';

interface ComboChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface ProductMetricsDataPoint {
  category: string;
  sales: number;
  customerRating: number;
  stockLevel: number;
  returnRate: number;
}

// Generate mock data for combo chart with revenue, orders, and average order value
const generateComboChartData = (
  pointCount = 10
): Record<string, string | number | Date | null>[] => {
  const data: Record<string, string | number | Date | null>[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - pointCount);

  for (let i = 0; i < pointCount; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: date.toISOString(),
      revenue: faker.number.int({ min: 10000, max: 50000 }),
      orders: faker.number.int({ min: 100, max: 500 }),
      averageOrderValue: faker.number.int({ min: 50, max: 200 })
    });
  }
  return data;
};

const generateProductMetricsData = (): Record<string, string | number>[] => {
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home'];
  return categories.map((category) => ({
    category,
    sales: faker.number.int({ min: 50000, max: 200000 }),
    customerRating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    stockLevel: faker.number.int({ min: 50, max: 1000 }),
    returnRate: faker.number.float({ min: 1, max: 15, fractionDigits: 1 })
  }));
};

type ComboChartData = ComboChartDataPoint;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Combo'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const DualAxisCombo: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue'],
      category: []
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      averageOrderValue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } as any,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const RevenueAndOrders: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['orders'],
      tooltip: ['revenue', 'orders'],
      category: []
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      orders: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 3
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Number of Orders',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const DualLineChart: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(),
    comboChartAxis: {
      category: [],
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 2
      },
      averageOrderValue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: false,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const DualBarChart: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(),
    comboChartAxis: {
      category: [],
      x: ['date'],
      y: ['revenue'],
      y2: ['orders'],
      tooltip: ['revenue', 'orders']
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      orders: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Number of Orders',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const CompactView: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(5),
    comboChartAxis: {
      category: [],
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      averageOrderValue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[400px] h-[300px]'
  }
};

export const NoLegendNoGrid: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(),
    comboChartAxis: {
      category: [],
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      averageOrderValue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: false,
    showLegend: false,
    className: 'w-[800px] h-[400px]'
  }
};

export const LargeDataset: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateComboChartData(30),
    comboChartAxis: {
      category: [],
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      averageOrderValue: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 3,
        lineWidth: 1.5
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat
    } satisfies Record<keyof ComboChartData, ColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[600px] h-[400px]'
  }
};

export const MultipleY2Axes: Story = {
  args: {
    selectedChartType: 'combo',
    data: generateProductMetricsData(),
    comboChartAxis: {
      category: [],
      x: ['category'],
      y: ['sales'],
      y2: ['stockLevel'], // 'returnRate', 'customerRating'
      tooltip: ['sales', 'customerRating', 'stockLevel', 'returnRate']
    },
    columnSettings: {
      sales: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      },
      customerRating: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 2
      },
      stockLevel: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      },
      returnRate: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string'
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      customerRating: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' ★'
      } as ColumnLabelFormat,
      stockLevel: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' units'
      } as ColumnLabelFormat,
      returnRate: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: '%'
      } as ColumnLabelFormat
    },
    yAxisAxisTitle: 'Sales Revenue',
    y2AxisAxisTitle: 'Multiple Metrics',
    gridLines: true,
    showLegend: true,
    className: 'w-[600px] h-[400px]'
  }
};

export const ProblematicData: Story = {
  args: {
    selectedChartType: 'combo',
    columnLabelFormats: {
      quarter_date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
        dateFormat: '[Q]Q YYYY'
      },
      discount_percentage: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'percent',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        multiplier: 1,
        replaceMissingDataWith: 0
      },
      orders_with_discount: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        replaceMissingDataWith: 0
      },
      metric_discountimpact: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        replaceMissingDataWith: 0
      }
    },
    columnSettings: {
      orders_with_discount: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'line'
      },
      metric_discountimpact: {
        ...DEFAULT_COLUMN_SETTINGS,
        columnVisualization: 'bar'
      }
    },
    comboChartAxis: {
      category: [],
      x: ['quarter_date'],
      y: ['metric_discountimpact', 'orders_with_discount'],
      y2: [],
      tooltip: null
    },
    columnMetadata: [
      {
        name: 'quarter_date',
        min_value: '2024-07-01T00:00:00.000Z',
        max_value: '2024-07-01T00:00:00.000Z',
        unique_values: 25,
        simple_type: 'date',
        type: 'timestamp'
      },
      {
        name: 'metric_discountimpact',
        min_value: '1653.212913',
        max_value: '6048.739098',
        unique_values: 3,
        simple_type: 'number',
        type: 'varchar'
      },
      {
        name: 'discount_percentage',
        min_value: '12.52582055274268390000',
        max_value: '6.58349064266693910000',
        unique_values: 3,
        simple_type: 'number',
        type: 'varchar'
      },
      {
        name: 'orders_with_discount',
        min_value: '2041-01-01T00:00:00.000Z',
        max_value: '2041-01-01T00:00:00.000Z',
        unique_values: 3,
        simple_type: 'date',
        type: 'timestamp'
      }
    ],
    data: [
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 41
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 20
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 6.5834906426669395,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 4.967794772304576,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 6048.739098,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 1653.212913,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-07-01T00:00:00Z',
        metric_discountimpact: 2670.398499,
        discount_percentage: 12.525820552742683,
        orders_with_discount: 14
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 26
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 35
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 27.991876058496533,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 19.991085064273747,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 2546.479147,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 7383.92633,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 56
      },
      {
        quarter_date: '2024-10-01T00:00:00Z',
        metric_discountimpact: 14031.083896,
        discount_percentage: 5.950496717114561,
        orders_with_discount: 56
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 49
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 0,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 12939.203262,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      },
      {
        quarter_date: '2025-01-01T00:00:00Z',
        metric_discountimpact: 0,
        discount_percentage: 24.612962860152674,
        orders_with_discount: 0
      }
    ]
  }
};
