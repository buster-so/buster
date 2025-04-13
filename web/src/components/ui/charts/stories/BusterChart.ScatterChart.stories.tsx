import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generateScatterChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useDebounceFn } from '@/hooks';
import dayjs from 'dayjs';

type ScatterChartData = ReturnType<typeof generateScatterChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Scatter'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
    data: generateScatterChartData(50),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      category: ['category']
    },
    barAndLineAxis: {
      x: ['x'],
      y: ['y'],
      category: []
    },
    columnLabelFormats: {
      x: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      y: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      size: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ScatterChartData, IColumnLabelFormat>,
    className: 'w-[400px] h-[400px]'
  }
};

export const WithoutCategory: Story = {
  args: {
    ...Default.args,
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      category: []
    }
  }
};

export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: generateScatterChartData(3000)
  },
  render: (args) => {
    const [isPending, startTransition] = React.useTransition();
    const [points, setPoints] = React.useState(200);
    const [data, setData] = React.useState(generateScatterChartData(points));

    const { run: onSetData } = useDebounceFn(
      (value: number) => {
        startTransition(() => {
          setData(generateScatterChartData(value));
        });
      },
      { wait: 700 }
    );

    const onChangeValue = (value: number) => {
      setPoints(value);
      onSetData(value);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm">Number of points:</span>
          <div className="w-64">
            <Slider
              min={0}
              max={50000}
              step={50}
              defaultValue={[points]}
              onValueChange={(value) => onChangeValue(value[0])}
            />
          </div>
          <span className="w-16 text-sm">{points}</span>
        </div>
        <div className="h-[400px] w-[400px]" key={points}>
          <BusterChart {...args} data={data} />
        </div>
      </div>
    );
  }
};

export const WithSize: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 5 }, (x, index) => ({
      x: index,
      y: index,
      size: index,
      category: 'Electronics'
    })),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: ['size']
    },
    columnMetadata: [
      {
        name: 'size',
        min_value: 0,
        max_value: 5,
        unique_values: 3,
        simple_type: 'number',
        type: 'number'
      }
    ]
  }
};

export const ScatterWithTrendline_NumericalXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        revenue: value
      };
    }),
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Growth Pattern',
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

export const ScatterWithTrendline_DateXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        date: dayjs('2020-01-01').add(i, 'day').toDate(),
        revenue: value
      };
    }),
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Growth Pattern',
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

export const ScatterWithTrendline_NumericalXAxisLinearRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        revenue: value
      };
    }),
    scatterAxis: {
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
        trendlineLabel: 'Linear Growth Pattern',
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

export const ScatterWithTrendline_DateXAxisLinearRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        date: dayjs('2020-01-01').add(i, 'day').toDate(),
        revenue: value
      };
    }),
    scatterAxis: {
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
        trendlineLabel: 'Linear Growth Pattern',
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

export const ScatterWithTrendline_NumericalXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        revenue: value
      };
    }),
    scatterAxis: {
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

export const ScatterWithTrendline_DateXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
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
        date: dayjs('2020-01-01').add(i, 'day').toDate(),
        revenue: value
      };
    }),
    scatterAxis: {
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
