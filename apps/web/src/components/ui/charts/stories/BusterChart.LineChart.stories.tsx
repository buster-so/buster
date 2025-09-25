import {
  type BarAndLineAxis,
  type ChartConfigProps,
  type ColumnLabelFormat,
  type ColumnSettings,
  type DataMetadata,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type Trendline,
} from '@buster/server-shared/metrics';
import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { createDefaultChartConfig } from '@/lib/metrics/messageAutoChartHandler';
import { addNoise, generateLineChartData } from '../../../../mocks/chart/chartMocks';
import type { BusterChart } from '../BusterChart';
import type { BusterChartProps } from '../BusterChart.types';
import { sharedMeta } from './BusterChartShared';

type LineChartData = ReturnType<typeof generateLineChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Line',
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: [],
      tooltip: null,
    },
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths: Story = {
  args: {
    selectedChartType: 'line',
    xAxisTimeInterval: 'month',
    data: Array.from({ length: 99 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'month').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
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
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args,
    xAxisTimeInterval: undefined,
  },
};

export const AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args,
    data: Array.from({ length: 99 })
      .map((_, i) => ({
        index: i,
        date: dayjs('2024-01-01').add(i, 'month').toISOString(),
        sales: addNoise(i * 15 + 55, 10),
      }))
      .filter(({ index }) => index !== 3 && index !== 5),
  },
};

export const AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit_ManyMonths.args,
    xAxisTimeInterval: undefined,
  },
};

export const AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit: Story = {
  args: {
    selectedChartType: 'line',
    xAxisTimeInterval: 'month',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'month').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
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
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit.args,
    xAxisTimeInterval: undefined,
  },
};

export const AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit.args,
    data: Array.from({ length: 12 })
      .map((_, i) => ({
        index: i,
        date: dayjs('2024-01-01').add(i, 'month').toISOString(),
        sales: addNoise(i * 15 + 55, 10),
      }))
      .filter(({ index }) => index !== 3 && index !== 5),
  },
};

export const AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit.args,
    xAxisTimeInterval: undefined,
  },
};

export const AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit: Story = {
  args: {
    selectedChartType: 'line',
    xAxisTimeInterval: 'day',
    data: Array.from({ length: 31 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'day').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    className: 'resize overflow-auto min-w-[250px] h-[400px]',
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
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_ManyDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit.args,
    data: Array.from({ length: 366 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'day').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
  },
};

export const AutoDateFormat_TimeIntervalTest_Days_WithAutoUnit_ManyDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_ManyDays.args,
    xAxisTimeInterval: undefined,
  },
};

export const AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_UnevenDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit.args,
    data: Array.from({ length: 31 })
      .filter((_, i) => i !== 1 && i !== 15 && i !== 16)
      .map((_, i) => ({
        date: dayjs('2024-01-01').add(i, 'day').toISOString(),
        sales: addNoise(i * 15 + 55, 10),
      })),
  },
};

export const AutoDateFormat_TimeIntervalTest_Days_WithAutoUnit_UnevenDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_UnevenDays.args,
    xAxisTimeInterval: undefined,
  },
};

export const FixedDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args,
    xAxisTimeInterval: 'month',
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_MonthWithAutoUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit_ManyMonths.args,
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit_ManyMonths.args,
    xAxisTimeInterval: 'month',
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit_ManyMonths: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit_ManyMonths.args,
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_MonthWithAutoUnit_BUSTED: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit.args,
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_MonthWithAutoUnit.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit.args,
    xAxisTimeInterval: 'month',
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_UnevenMonthsForcedUnit.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit_BUSTED: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit.args,
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_UnevenMonthsAutoUnit.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_Days_WithForcedUnit: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit.args,
    data: Array.from({ length: 131 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'day').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    xAxisTimeInterval: 'day',
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD, YYYY',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_Days_WithForcedUnit_UnevenDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_UnevenDays.args,
    xAxisTimeInterval: 'day',
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_Days_WithForcedUnit_UnevenDays.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
    },
  },
};

export const FixedDateFormat_TimeIntervalTest_Days_WithAutoUnit_UnevenDays: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_Days_WithAutoUnit_UnevenDays.args,
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_Days_WithAutoUnit_UnevenDays.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
    },
  },
};

export const XAxisTimeIntervalWithMismatchingData_Days: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args,
    xAxisTimeInterval: 'day',
    data: Array.from({ length: 31 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'day').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
    },
  },
};

export const XAxisTimeIntervalWithMismatchingData_Months: Story = {
  args: {
    ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args,
    xAxisTimeInterval: 'month',
    data: Array.from({ length: 14 }, (_, i) => ({
      date: dayjs('2024-01-01').add(i, 'month').toISOString(),
      sales: addNoise(i * 15 + 55, 10),
    })),
    columnLabelFormats: {
      ...AutoDateFormat_TimeIntervalTest_MonthWithForcedUnit_ManyMonths.args!.columnLabelFormats,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
    },
  },
};

// Simple X and Y axis with numeric values
export const NumericXY: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { score: 10, value: 100 },
      { score: 20, value: 200 },
      { score: 30, value: 150 },
      { score: 40, value: 300 },
      { score: 50, value: 250 },
    ],
    barAndLineAxis: {
      x: ['score'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      score: {
        columnType: 'number',
        style: 'number',
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
      } as ColumnLabelFormat,
    },
  },
};

export const NumericXYThatCorrespondToAMonth: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sales: addNoise(i * 15 + 55, 10),
    })),
    barAndLineAxis: {
      x: ['month'],
      y: ['sales'],
      category: [],
      tooltip: null,
    },
    xAxisTimeInterval: 'month',
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      month: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'MMM',
        convertNumberTo: 'month_of_year',
      } as ColumnLabelFormat,
    },
  },
};

// X axis with categorical data and Y axis with numeric values
export const CategoricalXNumericY: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { category: 'A', value: 100 },
      { category: 'B', value: 200 },
      { category: 'C', value: 150 },
      { category: 'D', value: 300 },
      { category: 'E', value: 250 },
    ],
    barAndLineAxis: {
      x: ['category'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
      } as ColumnLabelFormat,
    },
  },
};

// Multi-year date range
export const MultiYearDate: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { date: new Date('2020-01-01'), value: 100 },
      { date: new Date('2021-01-01'), value: 150 },
      { date: new Date('2022-01-01'), value: 200 },
      { date: new Date('2023-01-01'), value: 250 },
      { date: new Date('2024-01-01'), value: 300 },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px] resize overflow-auto',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto', // Show only year for multi-year view
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
      } as ColumnLabelFormat,
    },
  },
};

// Multiple Y axes with date X axis
export const MultipleYAxes: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      {
        date: new Date('2024-01-01'),
        revenue: 1000,
        units: 50,
        satisfaction: 4.5,
      },
      {
        date: new Date('2024-02-01'),
        revenue: 1200,
        units: 60,
        satisfaction: 4.7,
      },
      {
        date: new Date('2024-03-01'),
        revenue: 1400,
        units: 70,
        satisfaction: 4.8,
      },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'units', 'satisfaction'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
      } as ColumnLabelFormat,
      satisfaction: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      } as ColumnLabelFormat,
    },
  },
};

// Unevenly spaced dates
export const UnevenlySpacedDates: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { date: new Date('2024-01-05').toISOString(), value: 120 },
      { date: new Date('2024-01-28').toISOString(), value: 145 },
      { date: new Date('2024-02-15').toISOString(), value: 160 },
      { date: new Date('2024-03-02').toISOString(), value: 155 },
      { date: new Date('2024-04-18').toISOString(), value: 180 },
      { date: new Date('2024-05-30').toISOString(), value: 210 },
      { date: new Date('2024-07-12').toISOString(), value: 195 },
      { date: new Date('2024-08-03').toISOString(), value: 225 },
      { date: new Date('2024-09-22').toISOString(), value: 240 },
      { date: new Date('2024-11-15').toISOString(), value: 260 },
      { date: new Date('2024-12-28').toISOString(), value: 280 },
      { date: new Date('2025-04-08').toISOString(), value: 310 },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px]  h-[400px]',

    columnSettings: {
      value: {
        lineSymbolSize: 5,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto', // Full date format to show uneven spacing clearly
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
    },
  },
};

// Closely spaced dates
export const CloselySpacedDates: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { date: new Date('2024-01-01').toISOString(), value: 120 },
      { date: new Date('2024-01-03').toISOString(), value: 145 },
      { date: new Date('2024-01-05').toISOString(), value: 160 },
      { date: new Date('2024-01-07').toISOString(), value: 155 },
      { date: new Date('2024-01-08').toISOString(), value: 180 },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px] resize overflow-auto',
    columnSettings: {
      value: {
        lineSymbolSize: 5,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto', // Full date format to show spacing clearly
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
    },
  },
};

// X, Y, and Category axes combined
export const WithCategory: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { month: new Date('2024-01-01').toISOString(), sales: 1200, region: 'North' },
      { month: new Date('2024-02-01').toISOString(), sales: 1400, region: 'North' },
      { month: new Date('2024-03-01').toISOString(), sales: 1600, region: 'North' },
      { month: new Date('2024-01-01').toISOString(), sales: 800, region: 'South' },
      { month: new Date('2024-02-01').toISOString(), sales: 900, region: 'South' },
      { month: new Date('2024-03-01').toISOString(), sales: 1100, region: 'South' },
      { month: new Date('2024-01-01').toISOString(), sales: 1500, region: 'East' },
      { month: new Date('2024-02-01').toISOString(), sales: 1700, region: 'East' },
      { month: new Date('2024-03-01').toISOString(), sales: 1900, region: 'East' },
      { month: new Date('2024-01-01').toISOString(), sales: 1000, region: 'West' },
      { month: new Date('2024-02-01').toISOString(), sales: 1300, region: 'West' },
      { month: new Date('2024-03-01').toISOString(), sales: 1500, region: 'West' },
    ],
    barAndLineAxis: {
      x: ['month'],
      y: ['sales'],
      category: ['region'],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      month: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      region: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
    },
  },
};

// Multiple Y axes with Category
export const MultipleYAxesWithCategory: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      {
        date: new Date('2024-01-01').toISOString(),
        revenue: 1200,
        satisfaction: 4.2,
        product: 'Hardware',
      },
      {
        date: new Date('2024-02-01').toISOString(),
        revenue: 1400,
        satisfaction: 4.3,
        product: 'Hardware',
      },
      {
        date: new Date('2024-03-01').toISOString(),
        revenue: 1600,
        satisfaction: 4.4,
        product: 'Hardware',
      },
      {
        date: new Date('2024-01-01').toISOString(),
        revenue: 800,
        satisfaction: 4.7,
        product: 'Software',
      },
      {
        date: new Date('2024-02-01').toISOString(),
        revenue: 1000,
        satisfaction: 4.8,
        product: 'Software',
      },
      {
        date: new Date('2024-03-01').toISOString(),
        revenue: 1200,
        satisfaction: 4.9,
        product: 'Software',
      },
      {
        date: new Date('2024-01-01').toISOString(),
        revenue: 2000,
        satisfaction: 4.0,
        product: 'Services',
      },
      {
        date: new Date('2024-02-01').toISOString(),
        revenue: 2200,
        satisfaction: 4.1,
        product: 'Services',
      },
      {
        date: new Date('2024-03-01').toISOString(),
        revenue: 2400,
        satisfaction: 4.2,
        product: 'Services',
      },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'satisfaction'],
      category: ['product'],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      satisfaction: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      } as ColumnLabelFormat,
      product: {
        columnType: 'text',
        style: 'string',
      } as ColumnLabelFormat,
    },
  },
};

// Numeric month X axis
export const NumericMonthX: Story = {
  args: {
    selectedChartType: 'line',
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
      { month: 12, sales: 2500, customers: 300 },
    ],
    barAndLineAxis: {
      x: ['month'],
      y: ['sales', 'customers'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',

    columnLabelFormats: {
      month: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const PercentageStackedLineSingle: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const PercentageStackedLineMultiple: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'lll',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const PercentageStackedLineSingleWithDataLabels: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'EUR',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const StackedAreaLineMultipleWithDataLabels: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
      profit: {
        showDataLabels: true,
      } as ColumnSettings,
      customers: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const StackedAreaLineSingleWithDataLabels: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'EUR',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const PercentageStackedLineMultipleWithDataLabels: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(),
    lineGroupType: 'percentage-stack',
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
      profit: {
        showDataLabels: true,
      } as ColumnSettings,
      customers: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'number',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
    },
  },
};

export const HasMixedNullAndNumberValuesSingleLineWithMissingDataZero: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i === 5 ? null : i * 100,
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: 0,
      } as ColumnLabelFormat,
    },
  },
};

export const HasMixedNullAndNumberValuesSingleLineWithMissingDataNull: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i === 5 ? null : i * 100,
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: null,
      } as ColumnLabelFormat,
    },
  },
};

export const HasMixedNullAndNumberValuesSingleMultiLine: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: i % 5 === 0 ? null : i * 100,
      profit: i % 7 === 0 ? null : i * 200,
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit'],
      category: [],
      tooltip: null,
    },

    className: 'w-[800px] h-[400px]',
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
      profit: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      } as ColumnLabelFormat,
    },
  },
};

export const HasNullValuesWithCategoryMultiLine: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 3 }).flatMap((_, productIndex) => {
      const category = ['Product A', 'Product B', 'Product C'][productIndex];
      return Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        revenue:
          i % 5 === 0 || (productIndex === 0 && i % 7 === 0) ? null : i * 100 + productIndex * 1000,
        category,
      }));
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
    },
    columnSettings: {
      revenue: {
        showDataLabels: true,
      } as ColumnSettings,
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      category: {
        columnType: 'text',
        style: 'string',
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        replaceMissingDataWith: 0,
      },
    } as any,
  },
};

export const WithTrendline_MaxMinAverageMedian: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: Math.round(100 * Math.pow(1.5, i)), // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'max',
        show: true,
        showTrendlineLabel: false,
        trendlineLabel: 'Testing Max',
        trendLineColor: 'red',
        columnId: 'revenue',
      },
      {
        type: 'min',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Min',
        trendLineColor: 'blue',
        columnId: 'revenue',
      },
      {
        type: 'average',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Average',
        trendLineColor: 'green',
        columnId: 'revenue',
      },
      {
        type: 'median',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Median',
        trendLineColor: 'yellow',
        columnId: 'revenue',
      },
    ] as Trendline[],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    } as any,
  },
};

export const WithTrendline_DateXAxisLinearRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      revenue: Math.round(100 * Math.pow(1.5, i)), // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ],
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    } as any,
  },
};

export const WithTrendline_NumericalXAxisLinearRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      index: i + 1,
      revenue: Math.round(100 * Math.pow(1.5, i)), // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue',
      },
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_StringXAxisLinearRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      index: `Product ${i + 1}`,
      revenue: Math.round(100 * Math.pow(1.5, i)), // Using exponential growth with base 1.5
    })),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Testing Linear Regression',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_DateXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      },
    ] as Trendline[],
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_NumericalXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      },
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_StringXAxisExponentialRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'exponential_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_DateXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_NumericalXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_StringXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: 'line',
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
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const ExponentialDecreaseWithTrendline: Story = {
  args: {
    selectedChartType: 'line',
    data: [
      { date: dayjs('2024-01-01').add(1, 'day').toISOString(), value: 10000 },
      { date: dayjs('2024-01-02').add(2, 'day').toISOString(), value: 7500 },
      { date: dayjs('2024-01-03').add(3, 'day').toISOString(), value: 6600 },
      { date: dayjs('2024-01-04').add(4, 'day').toISOString(), value: 4200 },
      { date: dayjs('2024-01-05').add(5, 'day').toISOString(), value: 4750 },
      { date: dayjs('2024-01-06').add(6, 'day').toISOString(), value: 2360 },
      { date: dayjs('2024-01-07').add(7, 'day').toISOString(), value: 1770 },
      { date: dayjs('2024-01-08').add(8, 'day').toISOString(), value: 1330 },
      { date: dayjs('2024-01-09').add(9, 'day').toISOString(), value: 1000 },
      { date: dayjs('2024-01-10').add(10, 'day').toISOString(), value: 750 },
    ],
    barAndLineAxis: {
      x: ['date'],
      y: ['value'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD',
      } as ColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      } as ColumnLabelFormat,
    },
    trendlines: [
      {
        type: 'exponential_regression',
        columnId: 'value',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Trend',
      } as Trendline,
    ],
  },
};

export const WithTrendline_DateXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 30 }, (_, i) => {
      // Generate polynomial-like data with random noise
      const x = i / 5; // Scale x to make the curve more visible
      const noise = Math.round((Math.random() - 0.5) * 400);
      const value = Math.round(
        100 * Math.pow(x, 2) - // quadratic term
          50 * x + // linear term
          1000 + // constant term
          noise // random variation
      );
      return {
        date: dayjs('2024-01-01').add(i, 'day').toISOString(),
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_NumericalXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 30 }, (_, i) => {
      // Generate polynomial-like data with random noise
      const x = i / 5; // Scale x to make the curve more visible
      const noise = Math.round((Math.random() - 0.5) * 400);
      const value = Math.round(
        100 * Math.pow(x, 2) - // quadratic term
          50 * x + // linear term
          1000 + // constant term
          noise // random variation
      );
      return {
        index: i + 1,
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const WithTrendline_StringXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: 'line',
    data: Array.from({ length: 30 }, (_, i) => {
      // Generate polynomial-like data with random noise
      const x = i / 5; // Scale x to make the curve more visible
      const noise = Math.round((Math.random() - 0.5) * 400);
      const value = Math.round(
        100 * Math.pow(x, 2) - // quadratic term
          50 * x + // linear term
          1000 + // constant term
          noise // random variation
      );
      return {
        index: `Product ${i + 1}`,
        revenue: value,
      };
    }),
    barAndLineAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
      } as Trendline,
    ] as Trendline[],
    columnLabelFormats: {
      index: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string',
      },
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
      },
    },
  },
};

export const With2ThousandPoints: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(655),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
    },
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
    },
  },
};

export const With5ThousandPoints: Story = {
  args: {
    selectedChartType: 'line',
    data: generateLineChartData(1650),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
    },
    columnLabelFormats: {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'auto',
      },
    },
  },
};

export const DefaultWithLegendHeader: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    showLegendHeadline: 'current',
  },
};

export const DefaultWithLegendHeaderAverage: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    showLegendHeadline: 'average',
  },
};

export const CategoryWithLegendHeaderAverage: Story = {
  args: {
    ...CategoricalXNumericY.args,
    showLegend: true,
    showLegendHeadline: 'average',
  },
};

const dataMetadata: DataMetadata = {
  column_count: 2,
  row_count: 13,
  column_metadata: [
    {
      name: 'order_month',
      min_value: '2024-03-01T00:00:00.000Z',
      max_value: '2025-03-01T00:00:00.000Z',
      unique_values: 13,
      simple_type: 'date',
      type: 'timestamp',
    },
    {
      name: 'order_count',
      min_value: 375,
      max_value: 2326,
      unique_values: 13,
      simple_type: 'number',
      type: 'int4',
    },
  ],
} as const;

const test = createDefaultChartConfig({
  data_metadata: dataMetadata,
  chart_config: {
    columnLabelFormats: {
      order_count: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
        replaceMissingDataWith: 0,
      } as ColumnLabelFormat,
      order_month: {
        columnType: 'date',
        style: 'date',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
        dateFormat: 'MMM YYYY',
      } as ColumnLabelFormat,
    } as ChartConfigProps['columnLabelFormats'],
    barAndLineAxis: {
      x: ['order_month'],
      y: ['order_count'],
    } as BarAndLineAxis,
    selectedChartType: 'line',
  } as ChartConfigProps,
});
const data = [
  {
    order_month: '2024-03-01T00:00:00',
    order_count: 375,
  },
  {
    order_month: '2024-04-01T00:00:00',
    order_count: 1707,
  },
  {
    order_month: '2024-05-01T00:00:00',
    order_count: 1783,
  },
  {
    order_month: '2024-06-01T00:00:00',
    order_count: 1815,
  },
  {
    order_month: '2024-07-01T00:00:00',
    order_count: 1973,
  },
  {
    order_month: '2024-08-01T00:00:00',
    order_count: 2139,
  },
  {
    order_month: '2024-09-01T00:00:00',
    order_count: 2015,
  },
  {
    order_month: '2024-10-01T00:00:00',
    order_count: 2130,
  },
  {
    order_month: '2024-11-01T00:00:00',
    order_count: 2018,
  },
  {
    order_month: '2024-12-01T00:00:00',
    order_count: 2300,
  },
  {
    order_month: '2025-01-01T00:00:00',
    order_count: 2326,
  },
  {
    order_month: '2025-02-01T00:00:00',
    order_count: 1982,
  },
  {
    order_month: '2025-03-01T00:00:00',
    order_count: 871,
  },
];
const columnMetadata: BusterChartProps['columnMetadata'] = dataMetadata.column_metadata;

export const ProblematicChartWithBlackLabels: Story = {
  args: {
    ...test,
    data,
    columnMetadata: columnMetadata,
  },
};

const chartConfigForBrokenChart: Partial<ChartConfigProps> = {
  selectedChartType: 'line',
  columnLabelFormats: {
    month_year: {
      columnType: 'date',
      style: 'date',
      displayName: '',
      numberSeparatorStyle: null,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: null,
      compactNumbers: false,
      currency: 'USD',
      dateFormat: 'MMM YYYY',
      useRelativeTime: false,
    } as ColumnLabelFormat,
    monthly_sales: {
      columnType: 'number',
      style: 'currency',
      displayName: 'Monthly Sales',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: 0,
      compactNumbers: false,
      currency: 'USD',
      dateFormat: 'auto',
      useRelativeTime: false,
    } as ColumnLabelFormat,
    cumulative_sales: {
      columnType: 'number',
      style: 'currency',
      displayName: 'Cumulative Sales',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: 0,
      compactNumbers: false,
      currency: 'USD',
      dateFormat: 'auto',
      useRelativeTime: false,
    } as ColumnLabelFormat,
  },
  columnSettings: {},
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
  gridLines: true,
  showLegendHeadline: false,
  goalLines: [],
  trendlines: [],
  disableTooltip: false,
  yAxisShowAxisLabel: true,
  yAxisShowAxisTitle: true,
  yAxisScaleType: 'linear',
  xAxisShowAxisLabel: true,
  xAxisShowAxisTitle: true,
  xAxisLabelRotation: 'auto',
  xAxisDataZoom: false,
  y2AxisShowAxisLabel: true,
  y2AxisShowAxisTitle: true,
  y2AxisStartAxisAtZero: true,
  y2AxisScaleType: 'linear',
  barAndLineAxis: {
    x: ['month_year'],
    y: ['cumulative_sales'],
    category: [],
    tooltip: ['monthly_sales', 'cumulative_sales'],
  },
  barLayout: 'vertical',
  barSortBy: [],
  barGroupType: 'group',
  barShowTotalAtTop: false,
};
const columnMetadataForBrokenChart: BusterChartProps['columnMetadata'] = [
  {
    name: 'month_year',
    min_value: '2024-09-01T00:00:00.000Z',
    max_value: '2025-09-01T00:00:00.000Z',
    unique_values: 13,
    simple_type: 'date',
    type: 'date',
  },
  {
    name: 'monthly_sales',
    min_value: '',
    max_value: '',
    unique_values: 13,
    simple_type: 'number',
    type: 'int4',
  },
  {
    name: 'cumulative_sales',
    min_value: '',
    max_value: '',
    unique_values: 13,
    simple_type: 'number',
    type: 'int4',
  },
];
const dataForBrokenChart = [
  {
    month_year: '2024-09-01T00:00:00',
    monthly_sales: 26244,
    cumulative_sales: 26244,
  },
  {
    month_year: '2024-10-01T00:00:00',
    monthly_sales: 30882.3,
    cumulative_sales: 57126.3,
  },
  {
    month_year: '2024-11-01T00:00:00',
    monthly_sales: 15707.184,
    cumulative_sales: 72833.484,
  },
  {
    month_year: '2024-12-01T00:00:00',
    monthly_sales: 23308.512,
    cumulative_sales: 96141.996,
  },
  {
    month_year: '2025-01-01T00:00:00',
    monthly_sales: 21301.2,
    cumulative_sales: 117443.196,
  },
  {
    month_year: '2025-02-01T00:00:00',
    monthly_sales: 10992,
    cumulative_sales: 128435.196,
  },
  {
    month_year: '2025-03-01T00:00:00',
    monthly_sales: 12342.288,
    cumulative_sales: 140777.484,
  },
  {
    month_year: '2025-04-01T00:00:00',
    monthly_sales: 13920,
    cumulative_sales: 154697.484,
  },
  {
    month_year: '2025-05-01T00:00:00',
    monthly_sales: 14812.488,
    cumulative_sales: 169509.972,
  },
  {
    month_year: '2025-06-01T00:00:00',
    monthly_sales: 26056.224,
    cumulative_sales: 195566.196,
  },
  {
    month_year: '2025-07-01T00:00:00',
    monthly_sales: 21824.688,
    cumulative_sales: 217390.884,
  },
  {
    month_year: '2025-08-01T00:00:00',
    monthly_sales: 2520,
    cumulative_sales: 219910.884,
  },
  {
    month_year: '2025-09-01T00:00:00',
    monthly_sales: 1200,
    cumulative_sales: 221110.884,
  },
];
export const ProblematicChartWithBrokenChart: Story = {
  args: {
    ...chartConfigForBrokenChart,
    data: dataForBrokenChart,
    columnMetadata: columnMetadataForBrokenChart,
  },
};

export const WithQuarterAndYearXAxis: Story = {
  args: {
    selectedChartType: 'line',
    barAndLineAxis: {
      x: ['quarter', 'year'],
      y: ['high_margin_revenue', 'low_margin_revenue'],
      tooltip: null,
      category: [],
    },
    columnMetadata: [
      {
        name: 'year',
        min_value: 2022,
        max_value: 2025,
        unique_values: 4,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'quarter',
        min_value: 1,
        max_value: 4,
        unique_values: 4,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'high_margin_units',
        min_value: 452,
        max_value: 23956,
        unique_values: 13,
        simple_type: 'number',
        type: 'int8',
      },
      {
        name: 'low_margin_units',
        min_value: 1634,
        max_value: 14333,
        unique_values: 13,
        simple_type: 'number',
        type: 'int8',
      },
      {
        name: 'high_margin_revenue',
        min_value: 6319.35175,
        max_value: 696385.260972,
        unique_values: 13,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'low_margin_revenue',
        min_value: 1130044.903964,
        max_value: 7872064.032748,
        unique_values: 13,
        simple_type: 'number',
        type: 'numeric',
      },
    ],
    data: [
      {
        year: 2022,
        quarter: 3,
        high_margin_units: 452,
        low_margin_units: 1634,
        high_margin_revenue: 6319.35175,
        low_margin_revenue: 1130044.903964,
      },
      {
        year: 2022,
        quarter: 4,
        high_margin_units: 857,
        low_margin_units: 3420,
        high_margin_revenue: 12467.60825,
        low_margin_revenue: 2891214.733164,
      },
      {
        year: 2023,
        quarter: 1,
        high_margin_units: 606,
        low_margin_units: 3500,
        high_margin_revenue: 8447.367008,
        low_margin_revenue: 3327851.657924,
      },
      {
        year: 2023,
        quarter: 2,
        high_margin_units: 786,
        low_margin_units: 3787,
        high_margin_revenue: 11298.669564,
        low_margin_revenue: 3484714.338052,
      },
      {
        year: 2023,
        quarter: 3,
        high_margin_units: 8552,
        low_margin_units: 8727,
        high_margin_revenue: 417365.895535,
        low_margin_revenue: 5283449.213474,
      },
      {
        year: 2023,
        quarter: 4,
        high_margin_units: 9815,
        low_margin_units: 8701,
        high_margin_revenue: 485417.965839,
        low_margin_revenue: 4944753.908742,
      },
      {
        year: 2024,
        quarter: 1,
        high_margin_units: 5680,
        low_margin_units: 6534,
        high_margin_revenue: 256512.303963,
        low_margin_revenue: 3988084.369999,
      },
      {
        year: 2024,
        quarter: 2,
        high_margin_units: 7161,
        low_margin_units: 7274,
        high_margin_revenue: 331482.347283,
        low_margin_revenue: 4282932.212568,
      },
      {
        year: 2024,
        quarter: 3,
        high_margin_units: 15765,
        low_margin_units: 12357,
        high_margin_revenue: 530755.704548,
        low_margin_revenue: 6157508.203938,
      },
      {
        year: 2024,
        quarter: 4,
        high_margin_units: 23956,
        low_margin_units: 14333,
        high_margin_revenue: 696385.260972,
        low_margin_revenue: 7413756.636498,
      },
      {
        year: 2025,
        quarter: 1,
        high_margin_units: 18953,
        low_margin_units: 11676,
        high_margin_revenue: 515127.214716,
        low_margin_revenue: 7355026.222311,
      },
      {
        year: 2025,
        quarter: 2,
        high_margin_units: 20669,
        low_margin_units: 12674,
        high_margin_revenue: 566536.999903,
        low_margin_revenue: 7872064.032748,
      },
      {
        year: 2025,
        quarter: 3,
        high_margin_units: 13273,
        low_margin_units: 6310,
        high_margin_revenue: 345994.655997,
        low_margin_revenue: 3927753.259141,
      },
    ],
    columnLabelFormats: {
      year: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
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
      low_margin_units: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Low Margin Units',
        compactNumbers: true,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      high_margin_units: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'High Margin Units',
        compactNumbers: true,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      low_margin_revenue: {
        isUTC: false,
        style: 'currency',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Low Margin Revenue',
        compactNumbers: true,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      high_margin_revenue: {
        isUTC: false,
        style: 'currency',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'High Margin Revenue',
        compactNumbers: true,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
    },
  },
};

export const WithQuarterNumber_PermantBroken: Story = {
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
      x: ['year', 'quarter'],
      y: ['avg_gross_margin'],
      tooltip: null,
      category: [],
    },
    columnSettings: {},
    comboChartAxis: {
      x: [],
      y: [],
      y2: [],
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
    selectedChartType: 'line',
    tableColumnWidths: null,
    xAxisTimeInterval: null,
    columnLabelFormats: {
      year: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      quarter: {
        isUTC: false,
        style: 'number',
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
      negative_count: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Negative Products',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
      },
      avg_gross_margin: {
        isUTC: false,
        style: 'percent',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Average Gross Margin',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
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
    columnMetadata: [
      {
        name: 'year',
        min_value: 2022,
        max_value: 2025,
        unique_values: 4,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'quarter',
        min_value: 1,
        max_value: 4,
        unique_values: 4,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'avg_gross_margin',
        min_value: -15.38538138267754,
        max_value: 13.535758480065276,
        unique_values: 13,
        simple_type: 'number',
        type: 'numeric',
      },
      {
        name: 'negative_count',
        min_value: 0,
        max_value: 37,
        unique_values: 9,
        simple_type: 'number',
        type: 'int8',
      },
    ],
    data: [
      {
        year: 2022,
        quarter: 3,
        avg_gross_margin: 5.104114056564919,
        negative_count: 13,
      },
      {
        year: 2022,
        quarter: 4,
        avg_gross_margin: 1.8996067873773883,
        negative_count: 17,
      },
      {
        year: 2023,
        quarter: 1,
        avg_gross_margin: 2.3518147641617744,
        negative_count: 17,
      },
      {
        year: 2023,
        quarter: 2,
        avg_gross_margin: 2.253994159993576,
        negative_count: 17,
      },
      {
        year: 2023,
        quarter: 3,
        avg_gross_margin: -15.38538138267754,
        negative_count: 37,
      },
      {
        year: 2023,
        quarter: 4,
        avg_gross_margin: -0.37097575793903026,
        negative_count: 17,
      },
      {
        year: 2024,
        quarter: 1,
        avg_gross_margin: 1.4841226527352336,
        negative_count: 14,
      },
      {
        year: 2024,
        quarter: 2,
        avg_gross_margin: 1.6647203835444542,
        negative_count: 15,
      },
      {
        year: 2024,
        quarter: 3,
        avg_gross_margin: -4.72213972473674,
        negative_count: 28,
      },
      {
        year: 2024,
        quarter: 4,
        avg_gross_margin: 5.114081768462615,
        negative_count: 17,
      },
      {
        year: 2025,
        quarter: 1,
        avg_gross_margin: 13.535758480065276,
        negative_count: 0,
      },
      {
        year: 2025,
        quarter: 2,
        avg_gross_margin: 10.910645447490767,
        negative_count: 6,
      },
      {
        year: 2025,
        quarter: 3,
        avg_gross_margin: 11.49792588896277,
        negative_count: 5,
      },
    ],
  },
};

export const WithProblematicXAxis: Story = {
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
      x: ['month'],
      y: ['total_units_sold'],
      tooltip: null,
      category: [],
    },
    columnSettings: {},
    comboChartAxis: {
      x: [],
      y: [],
      y2: [],
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
    selectedChartType: 'line',
    tableColumnWidths: null,
    xAxisTimeInterval: null,
    columnLabelFormats: {
      month: {
        isUTC: false,
        style: 'date',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'date',
        dateFormat: 'MMM YYYY',
        multiplier: 1,
        displayName: '',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: null,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: null,
      },
      total_units_sold: {
        isUTC: false,
        style: 'number',
        prefix: '',
        suffix: '',
        currency: 'USD',
        columnType: 'number',
        dateFormat: 'auto',
        multiplier: 1,
        displayName: 'Total Units Sold',
        compactNumbers: false,
        convertNumberTo: null,
        useRelativeTime: false,
        numberSeparatorStyle: ',',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        makeLabelHumanReadable: true,
        replaceMissingDataWith: 0,
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
        month: '2024-09-01T00:00:00.000Z',
        total_units_sold: 15815,
      },
      {
        month: '2024-10-01T00:00:00.000Z',
        total_units_sold: 18673,
      },
      {
        month: '2024-11-01T00:00:00.000Z',
        total_units_sold: 11519,
      },
      {
        month: '2024-12-01T00:00:00.000Z',
        total_units_sold: 14671,
      },
      {
        month: '2025-01-01T00:00:00.000Z',
        total_units_sold: 15258,
      },
      {
        month: '2025-02-01T00:00:00.000Z',
        total_units_sold: 9125,
      },
      {
        month: '2025-03-01T00:00:00.000Z',
        total_units_sold: 11096,
      },
      {
        month: '2025-04-01T00:00:00.000Z',
        total_units_sold: 11291,
      },
      {
        month: '2025-05-01T00:00:00.000Z',
        total_units_sold: 11996,
      },
      {
        month: '2025-06-01T00:00:00.000Z',
        total_units_sold: 15314,
      },
      {
        month: '2025-07-01T00:00:00.000Z',
        total_units_sold: 15622,
      },
      {
        month: '2025-08-01T00:00:00.000Z',
        total_units_sold: 5183,
      },
      {
        month: '2025-09-01T00:00:00.000Z',
        total_units_sold: 1786,
      },
    ],
    columnMetadata: [
      {
        name: 'month',
        min_value: '2024-09-01T00:00:00.000Z',
        max_value: '2025-09-01T00:00:00.000Z',
        unique_values: 13,
        simple_type: 'date',
        type: 'timestamp',
      },
      {
        name: 'total_units_sold',
        min_value: 1786,
        max_value: 18673,
        unique_values: 13,
        simple_type: 'number',
        type: 'int8',
      },
    ],
  },
};
