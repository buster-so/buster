import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';
import type { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import type { BusterChart } from '../BusterChart';
import { sharedMeta } from './BusterChartShared';

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
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      averageOrderValue: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const RevenueAndOrders: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['orders'],
      tooltip: ['revenue', 'orders']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      orders: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Number of Orders',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const DualLineChart: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 2
      },
      averageOrderValue: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: false,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const DualBarChart: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['orders'],
      tooltip: ['revenue', 'orders']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      orders: {
        columnVisualization: 'bar'
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Number of Orders',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};

export const CompactView: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(5),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      averageOrderValue: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[400px] h-[300px]'
  }
};

export const NoLegendNoGrid: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      averageOrderValue: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: false,
    showLegend: false,
    className: 'w-[800px] h-[400px]'
  }
};

export const LargeDataset: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(30),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      averageOrderValue: {
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
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[600px] h-[400px]'
  }
};

export const MultipleY2Axes: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateProductMetricsData(),
    comboChartAxis: {
      x: ['category'],
      y: ['sales'],
      y2: ['stockLevel'], // 'returnRate', 'customerRating'
      tooltip: ['sales', 'customerRating', 'stockLevel', 'returnRate']
    },
    columnSettings: {
      sales: {
        columnVisualization: 'bar'
      },
      customerRating: {
        columnVisualization: 'line',
        lineSymbolSize: 6,
        lineWidth: 2
      },
      stockLevel: {
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      },
      returnRate: {
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      customerRating: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' ★'
      } satisfies IColumnLabelFormat,
      stockLevel: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: ' units'
      } satisfies IColumnLabelFormat,
      returnRate: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        suffix: '%'
      } satisfies IColumnLabelFormat
    },
    yAxisAxisTitle: 'Sales Revenue',
    y2AxisAxisTitle: 'Multiple Metrics',
    gridLines: true,
    showLegend: true,
    className: 'w-[600px] h-[400px]'
  }
};
