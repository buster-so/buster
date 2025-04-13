import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generateLineChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';

type LineChartData = ReturnType<typeof generateLineChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Line'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof LineChartData, IColumnLabelFormat>
  }
};

// Simple X and Y axis with numeric values
export const NumericXY: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { score: 10, value: 100 },
      { score: 20, value: 200 },
      { score: 30, value: 150 },
      { score: 40, value: 300 },
      { score: 50, value: 250 }
    ],
    barAndLineAxis: {
      x: ['score'],
      y: ['value'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      score: {
        columnType: 'number',
        style: 'number'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number'
      } satisfies IColumnLabelFormat
    }
  }
};

// X axis with categorical data and Y axis with numeric values
export const CategoricalXNumericY: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { category: 'A', value: 100 },
      { category: 'B', value: 200 },
      { category: 'C', value: 150 },
      { category: 'D', value: 300 },
      { category: 'E', value: 250 }
    ],
    barAndLineAxis: {
      x: ['category'],
      y: ['value'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number'
      } satisfies IColumnLabelFormat
    }
  }
};

// Multi-year date range
export const MultiYearDate: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { date: new Date('2020-01-01'), value: 100 },
      { date: new Date('2021-01-01'), value: 150 },
      { date: new Date('2022-01-01'), value: 200 },
      { date: new Date('2023-01-01'), value: 250 },
      { date: new Date('2024-01-01'), value: 300 }
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'YYYY' // Show only year for multi-year view
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number'
      } satisfies IColumnLabelFormat
    }
  }
};

// Multiple Y axes with date X axis
export const MultipleYAxes: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      {
        date: new Date('2024-01-01'),
        revenue: 1000,
        units: 50,
        satisfaction: 4.5
      },
      {
        date: new Date('2024-02-01'),
        revenue: 1200,
        units: 60,
        satisfaction: 4.7
      },
      {
        date: new Date('2024-03-01'),
        revenue: 1400,
        units: 70,
        satisfaction: 4.8
      }
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'units', 'satisfaction'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM YYYY'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number'
      } satisfies IColumnLabelFormat,
      satisfaction: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat
    }
  }
};

// Unevenly spaced dates
export const UnevenlySpacedDates: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { date: new Date('2024-01-05'), value: 120 },
      { date: new Date('2024-01-28'), value: 145 },
      { date: new Date('2024-02-15'), value: 160 },
      { date: new Date('2024-03-02'), value: 155 },
      { date: new Date('2024-04-18'), value: 180 },
      { date: new Date('2024-05-30'), value: 210 },
      { date: new Date('2024-07-12'), value: 195 },
      { date: new Date('2024-08-03'), value: 225 },
      { date: new Date('2024-09-22'), value: 240 },
      { date: new Date('2024-11-15'), value: 260 },
      { date: new Date('2024-12-28'), value: 280 },
      { date: new Date('2025-04-08'), value: 310 }
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'll' // Full date format to show uneven spacing clearly
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat
    }
  }
};

// X, Y, and Category axes combined
export const WithCategory: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { month: new Date('2024-01-01'), sales: 1200, region: 'North' },
      { month: new Date('2024-02-01'), sales: 1400, region: 'North' },
      { month: new Date('2024-03-01'), sales: 1600, region: 'North' },
      { month: new Date('2024-01-01'), sales: 800, region: 'South' },
      { month: new Date('2024-02-01'), sales: 900, region: 'South' },
      { month: new Date('2024-03-01'), sales: 1100, region: 'South' },
      { month: new Date('2024-01-01'), sales: 1500, region: 'East' },
      { month: new Date('2024-02-01'), sales: 1700, region: 'East' },
      { month: new Date('2024-03-01'), sales: 1900, region: 'East' },
      { month: new Date('2024-01-01'), sales: 1000, region: 'West' },
      { month: new Date('2024-02-01'), sales: 1300, region: 'West' },
      { month: new Date('2024-03-01'), sales: 1500, region: 'West' }
    ],
    barAndLineAxis: {
      x: ['month'],
      y: ['sales'],
      category: ['region']
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      month: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM YYYY'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      region: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat
    }
  }
};

// Multiple Y axes with Category
export const MultipleYAxesWithCategory: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { date: new Date('2024-01-01'), revenue: 1200, satisfaction: 4.2, product: 'Hardware' },
      { date: new Date('2024-02-01'), revenue: 1400, satisfaction: 4.3, product: 'Hardware' },
      { date: new Date('2024-03-01'), revenue: 1600, satisfaction: 4.4, product: 'Hardware' },
      { date: new Date('2024-01-01'), revenue: 800, satisfaction: 4.7, product: 'Software' },
      { date: new Date('2024-02-01'), revenue: 1000, satisfaction: 4.8, product: 'Software' },
      { date: new Date('2024-03-01'), revenue: 1200, satisfaction: 4.9, product: 'Software' },
      { date: new Date('2024-01-01'), revenue: 2000, satisfaction: 4.0, product: 'Services' },
      { date: new Date('2024-02-01'), revenue: 2200, satisfaction: 4.1, product: 'Services' },
      { date: new Date('2024-03-01'), revenue: 2400, satisfaction: 4.2, product: 'Services' }
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'satisfaction'],
      category: ['product']
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM YYYY'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      satisfaction: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat
    }
  }
};

// Numeric month X axis
export const NumericMonthX: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: [
      { month: 1, sales: 1000, customers: 150 },
      { month: 2, sales: 1200, customers: 180 },
      { month: 3, sales: 1100, customers: 165 },
      { month: 4, sales: 1400, customers: 200 },
      { month: 5, sales: 1600, customers: 220 },
      { month: 6, sales: 1800, customers: 240 },
      { month: 7, sales: 2000, customers: 260 },
      { month: 8, sales: 2200, customers: 280 },
      { month: 9, sales: 2100, customers: 270 },
      { month: 10, sales: 1900, customers: 250 },
      { month: 11, sales: 2300, customers: 290 },
      { month: 12, sales: 2500, customers: 300 }
    ],
    barAndLineAxis: {
      x: ['month'],
      y: ['sales', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',

    columnLabelFormats: {
      month: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'MMM',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const PercentageStackedLineSingle: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'LLL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const PercentageStackedLineMultiple: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'lll',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const PercentageStackedLineSingleWithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'EUR'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const StackedAreaLineMultipleWithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      },
      profit: {
        showDataLabels: true
      },
      customers: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const StackedAreaLineSingleWithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'EUR'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const PercentageStackedLineMultipleWithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      },
      profit: {
        showDataLabels: true
      },
      customers: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    }
  }
};

export const HasMixedNullAndNumberValuesSingleLineWithMissingDataZero: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i === 5 ? null : i * 100
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: 0
      } satisfies IColumnLabelFormat
    }
  }
};

export const HasMixedNullAndNumberValuesSingleLineWithMissingDataNull: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i === 5 ? null : i * 100
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: null
      } satisfies IColumnLabelFormat
    }
  }
};

export const HasMixedNullAndNumberValuesSingleMultiLine: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i % 5 === 0 ? null : i * 100,
      profit: i % 7 === 0 ? null : i * 200
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit'],
      category: []
    },

    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true
      },
      profit: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat
    }
  }
};

export const HasNullValuesWithCategoryMultiLine: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 3 }).flatMap((_, productIndex) => {
      const category = ['Product A', 'Product B', 'Product C'][productIndex];
      return Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        revenue:
          i % 5 === 0 || (productIndex === 0 && i % 7 === 0) ? null : i * 100 + productIndex * 1000,
        category
      }));
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category']
    },
    columnSettings: {
      revenue: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto'
      },
      category: {
        columnType: 'text',
        style: 'string'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: 0
      }
    }
  }
};

export const WithTrendline_MaxMinAverageMedian: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: Math.round(100 * Math.pow(1.5, i)) // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'max',
        show: true,
        showTrendlineLabel: false,
        trendlineLabel: 'Testing Max',
        trendLineColor: 'red',
        columnId: 'revenue'
      },
      {
        type: 'min',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Min',
        trendLineColor: 'blue',
        columnId: 'revenue'
      },
      {
        type: 'average',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Average',
        trendLineColor: 'green',
        columnId: 'revenue'
      },
      {
        type: 'median',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Median',
        trendLineColor: 'yellow',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_DateXAxisLinearRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: Math.round(100 * Math.pow(1.5, i)) // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_NumericalXAxisLinearRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      index: i + 1,
      revenue: Math.round(100 * Math.pow(1.5, i)) // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'number',
        style: 'number'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_StringXAxisLinearRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 12 }, (_, i) => ({
      index: `Product ${i + 1}`,
      revenue: Math.round(100 * Math.pow(1.5, i)) // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'text',
        style: 'string'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_DateXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        date: dayjs('2024-01-01').add(i, 'day').toISOString(),
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_NumericalXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        index: i + 1,
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'number',
        style: 'number'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_StringXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        index: `Product ${i + 1}`,
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'text',
        style: 'string'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_DateXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        date: dayjs('2024-01-01').add(i, 'day').toISOString(),
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_NumericalXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        index: i + 1,
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'number',
        style: 'number'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const WithTrendline_StringXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: Array.from({ length: 30 }, (_, i) => {
      // Add random noise between -200 and 200
      const noise = Math.round((Math.random() - 0.5) * 400);
      // Less steep logarithmic curve with linear component and noise
      const value = Math.round(
        800 * Math.log(i + 1) + // logarithmic component
          i * 30 + // linear component
          500 + // base value
          noise // random variation
      );
      return {
        index: `Product ${i + 1}`,
        revenue: value
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue'
      }
    ],
    columnLabelFormats: {
      index: {
        columnType: 'text',
        style: 'string'
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

// export const WithTrendline_PolynomialRegression: Story = {
//   args: {
//     selectedChartType: ChartType.Line,
//     data: Array.from({ length: 12 }, (_, i) => ({
//       date: new Date(2024, 0, i + 1).toISOString(),
//       revenue: Math.round(100 * Math.pow(1.5, i)) // Using exponential growth with base 1.5
//     })),
//     barAndLineAxis: {
//       x: ['date'],
//       y: ['revenue'],
//       category: []
//     },
//     className: 'w-[800px] h-[400px]',
//     trendlines: [
//       {
//         type: 'polynomial_regression',
//         show: true,
//         showTrendlineLabel: true,
//         trendlineLabel: 'Testing Polynomial Regression',
//         trendLineColor: 'red',
//         columnId: 'revenue'
//       }
//     ],
//     columnLabelFormats: {
//       date: {
//         columnType: 'date',
//         style: 'date',
//         dateFormat: 'auto'
//       },
//       revenue: {
//         columnType: 'number',
//         style: 'currency',
//         currency: 'USD'
//       }
//     }
//   }
// };

// export const WithTrendline_PolynomialRegression_Scatter: Story = {
//   args: {
//     selectedChartType: ChartType.Scatter,
//     data: Array.from({ length: 3 }).flatMap((_, productIndex) =>
//       Array.from({ length: 12 }, (_, i) => ({
//         expenses: i,
//         revenue: faker.number.int({ min: 150 + i, max: 150 * (i + 1.2) })
//       }))
//     ),
//     scatterAxis: {
//       x: ['expenses'],
//       y: ['revenue'],
//       category: []
//     },
//     className: 'w-[800px] h-[400px]',
//     trendlines: [
//       {
//         type: 'polynomial_regression',
//         show: true,
//         showTrendlineLabel: true,
//         trendlineLabel: 'Testing Polynomial Regression',
//         trendLineColor: 'red',
//         columnId: 'revenue'
//       }
//     ],
//     columnLabelFormats: {
//       expenses: {
//         columnType: 'number',
//         style: 'number',
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 0
//       } satisfies IColumnLabelFormat,
//       revenue: {
//         columnType: 'number',
//         style: 'number',
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 0
//       } satisfies IColumnLabelFormat
//     }
//   }
// };
