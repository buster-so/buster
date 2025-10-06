import {
  type ColumnLabelFormat,
  DEFAULT_CHART_THEME,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useDebounceFn } from '@/hooks/useDebounce';
import { generateScatterChartData } from '../../../../mocks/chart/chartMocks';
import { BusterChart } from '../BusterChart';
import { sharedMeta } from './BusterChartShared';
import {
  scatterConfig_problematic1,
  scatterConfig_problematic2,
  scatterData_problematic2,
  scatterDataProblematic1,
} from './scatterData_problematic1';

type ScatterChartData = ReturnType<typeof generateScatterChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Scatter',
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: 'scatter',
    data: generateScatterChartData(50),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      tooltip: null,
      size: [],

      category: [],
    },
    columnLabelFormats: {
      x: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      } as ColumnLabelFormat,
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      } as ColumnLabelFormat,
      size: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ',',
      } as ColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string',
        prefix: '🔥 ',
        suffix: ' 🔥',
      } as ColumnLabelFormat,
    },
    className: 'w-[400px] h-[400px] max-w-[400px] max-h-[400px]',
  },
};

export const WithCategory: Story = {
  args: {
    ...Default.args,
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      tooltip: null,

      category: ['category'],
    },
  },
};

export const LargeDatasetNoCategory: Story = {
  args: {
    ...Default.args,
    data: generateScatterChartData(200),
  },
  render: (args) => {
    const [points, setPoints] = React.useState(200);
    const [data, setData] = React.useState(generateScatterChartData(points));
    const [processingTime, setProcessingTime] = React.useState(0);
    const startTimeRef = React.useRef(0);

    React.useEffect(() => {
      // Measure time after render is complete
      const endTime = performance.now();
      if (startTimeRef.current) {
        setProcessingTime(Math.round(endTime - startTimeRef.current));
      }
    }, [data]); // Only run when data changes

    const { run: onSetData } = useDebounceFn(
      (value: number) => {
        startTimeRef.current = performance.now(); // Start timing
        setData(generateScatterChartData(value));
      },
      { wait: 1000 }
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
              max={5000}
              step={50}
              defaultValue={[points]}
              onValueChange={(value) => onChangeValue(value[0])}
            />
          </div>
          <span className="w-16 text-sm">{points}</span>
        </div>
        <div>
          <span className="text-sm">Total processing time: {processingTime}ms</span>
        </div>
        <div className="h-[400px] w-[400px]" key={points}>
          <BusterChart {...args} data={data} />
        </div>
      </div>
    );
  },
};

export const LargeDatasetWithCategory: Story = {
  args: {
    ...Default.args,
    data: generateScatterChartData(200),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: [],
      tooltip: null,

      category: ['category'],
    },
  },
  render: (args) => {
    const [points, setPoints] = React.useState(200);
    const [data, setData] = React.useState(generateScatterChartData(points));
    const [processingTime, setProcessingTime] = React.useState(0);
    const startTimeRef = React.useRef(0);

    React.useEffect(() => {
      // Measure time after render is complete
      const endTime = performance.now();
      if (startTimeRef.current) {
        setProcessingTime(Math.round(endTime - startTimeRef.current));
      }
    }, [data]); // Only run when data changes

    const { run: onSetData } = useDebounceFn(
      (value: number) => {
        startTimeRef.current = performance.now(); // Start timing
        setData(generateScatterChartData(value));
      },
      { wait: 1000 }
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
              max={5000}
              step={50}
              defaultValue={[points]}
              onValueChange={(value) => onChangeValue(value[0])}
            />
          </div>
          <span className="w-16 text-sm">{points}</span>
        </div>
        <div>
          <span className="text-sm">Total processing time: {processingTime}ms</span>
        </div>
        <div className="h-[400px] w-[400px]" key={points}>
          <BusterChart {...args} data={data} />
        </div>
      </div>
    );
  },
};

export const WithSize: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 5 }, (x, index) => ({
      x: index,
      y: index,
      size: [55, 30, 0, 100, 50][index % 5],
      category: 'Electronics',
    })),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      tooltip: null,
      category: [],
      size: ['size'],
    },
    columnMetadata: [
      {
        name: 'size',
        min_value: 0,
        max_value: 100,
        unique_values: 5,
        simple_type: 'number',
        type: 'number',
      },
    ],
  },
};

export const ScatterWithTrendline_NumericalXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      tooltip: null,
      size: [],

      category: [],
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: false,
        trendlineLabel: 'HUH?',
        trendLineColor: 'brown',
        columnId: 'revenue',
        aggregateAllCategories: true,
        lineStyle: 'dotted',
        trendlineLabelPositionOffset: 15,
        projection: false,
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
      },
      {
        type: 'max',
        show: false,
        showTrendlineLabel: true,
        trendlineLabel: 'correct!',
        trendLineColor: 'inherit',
        columnId: 'revenue',
        aggregateAllCategories: true,
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
      },
      {
        type: 'max',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: null,
        trendLineColor: 'inherit',
        columnId: 'revenue',
        aggregateAllCategories: false,
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
      },
      {
        type: 'min',
        show: false,
        showTrendlineLabel: true,
        trendlineLabel: null,
        trendLineColor: 'inherit',
        columnId: 'revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
      {
        type: 'median',
        show: false,
        showTrendlineLabel: true,
        trendlineLabel: null,
        trendLineColor: 'inherit',
        columnId: 'revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
      {
        type: 'average',
        show: false,
        showTrendlineLabel: true,
        trendlineLabel: null,
        trendLineColor: 'inherit',
        columnId: 'revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
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

export const ScatterWithTrendline_NumericalXAxisPolynomialRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_NumericalXAxisPolynomialRegression.args,
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ScatterWithTrendline_DateXAxisPolynomialRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        revenue: value,
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
      size: [],
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
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
    ],
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

export const ScatterWithTrendline_DateXAxisPolynomialRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_DateXAxisPolynomialRegression.args,
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ScatterWithTrendline_NumericalXAxisLinearRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
      size: [],
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
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

export const ScatterWithTrendline_NumericalXAxisLinearRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_NumericalXAxisLinearRegression.args,
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ScatterWithTrendline_DateXAxisLinearRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        revenue: value,
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
      size: [],
    },
    className: 'w-[800px] h-[400px]',
    trendlines: [
      {
        type: 'linear_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Growth Pattern',
        trendLineColor: 'red',
        columnId: 'revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
    ],
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

export const ScatterWithTrendline_DateXAxisLinearRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_DateXAxisLinearRegression.args,
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ScatterWithTrendline_NumericalXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: [],
      tooltip: null,
      size: [],
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
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
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

export const ScatterWithTrendline_NumericalXAxisLogarithmicRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_NumericalXAxisLogarithmicRegression.args,
    scatterAxis: {
      x: ['index'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ScatterWithTrendline_DateXAxisLogarithmicRegression: Story = {
  args: {
    selectedChartType: 'scatter',
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
        revenue: value,
        category: ['Electronics', 'Books', 'Clothing'][i % 3],
      };
    }),
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: [],
      tooltip: null,
      size: [],
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
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
    ],
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

export const ScatterWithTrendline_DateXAxisLogarithmicRegression_CategoryAxis: Story = {
  args: {
    ...ScatterWithTrendline_DateXAxisLogarithmicRegression.args,
    scatterAxis: {
      x: ['date'],
      y: ['revenue'],
      category: ['category'],
      tooltip: null,
      size: [],
    },
  },
};

export const ProblematicDataset: Story = {
  args: {
    ...Default.args,
    data: scatterDataProblematic1.data,
    columnMetadata: scatterDataProblematic1.data_metadata.column_metadata,
    ...(scatterConfig_problematic1 as any),
    barAndLineAxis: {
      x: ['eligible_orders'],
      y: ['attach_rate'],
      category: ['merchant'],
    },
    selectedChartType: 'scatter',
  },
};

export const ProblematicDataset2: Story = {
  args: {
    ...Default.args,
    ...(scatterData_problematic2 as any),
    data: scatterData_problematic2.data,
    columnMetadata: scatterData_problematic2.data_metadata.column_metadata,
    ...(scatterConfig_problematic2 as any),
  },
};

export const ProblematicDatasetWithLinearRegression: Story = {
  args: {
    selectedChartType: 'scatter',
    columnLabelFormats: {
      total_cost: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        displayName: '',
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
      },
      total_revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        displayName: '',
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
      },
    },
    columnSettings: {
      total_cost: {
        showDataLabels: false,
        showDataLabelsAsPercentage: false,
        columnVisualization: 'bar',
        lineWidth: 2,
        lineStyle: 'line',
        lineType: 'normal',
        lineSymbolSize: 0,
        barRoundness: 8,
      },
      total_revenue: {
        showDataLabels: false,
        showDataLabelsAsPercentage: false,
        columnVisualization: 'bar',
        lineWidth: 2,
        lineStyle: 'line',
        lineType: 'normal',
        lineSymbolSize: 0,
        barRoundness: 8,
      },
    },
    colors: DEFAULT_CHART_THEME,
    gridLines: true,
    showLegendHeadline: false,
    goalLines: [],
    trendlines: [
      {
        show: true,
        showTrendlineLabel: true,
        type: 'linear_regression',
        columnId: 'total_revenue',
        trendLineColor: '#FF0000',
        trendlineLabel: null,
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
      },
    ],
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
    scatterAxis: {
      x: ['total_cost'],
      y: ['total_revenue'],
      category: [],
      tooltip: null,
      size: [],
    },
    scatterDotSize: [3, 15],
    data: [
      {
        total_revenue: 157772.394392,
        total_cost: 81998.7558,
      },
      {
        total_revenue: 160869.517836,
        total_cost: 85479.7116,
      },
      {
        total_revenue: 6060.3882,
        total_cost: 3759.7041,
      },
      {
        total_revenue: 513,
        total_cost: 305.667,
      },
      {
        total_revenue: 165406.617049,
        total_cost: 88240.9209,
      },
      {
        total_revenue: 51229.445623,
        total_cost: 57531.2353,
      },
      {
        total_revenue: 21445.71,
        total_cost: 16513.1967,
      },
      {
        total_revenue: 115249.214976,
        total_cost: 139958.0028,
      },
      {
        total_revenue: 198754.97536,
        total_cost: 253741.2416,
      },
      {
        total_revenue: 95611.19708,
        total_cost: 114707.054,
      },
      {
        total_revenue: 394255.5724,
        total_cost: 421287.587,
      },
      {
        total_revenue: 395182.6993,
        total_cost: 422156.2212,
      },
      {
        total_revenue: 89872.1736,
        total_cost: 94681.1278,
      },
      {
        total_revenue: 177635.904,
        total_cost: 192347.594,
      },
      {
        total_revenue: 24844.6922,
        total_cost: 26396.6379,
      },
      {
        total_revenue: 194692.599104,
        total_cost: 185472.6861,
      },
      {
        total_revenue: 132125.2522,
        total_cost: 125582.4141,
      },
      {
        total_revenue: 20104.4434,
        total_cost: 18715.71,
      },
      {
        total_revenue: 195933.4094,
        total_cost: 186408.4716,
      },
      {
        total_revenue: 137213.485128,
        total_cost: 130448.4987,
      },
      {
        total_revenue: 89224.5,
        total_cost: 88034.85,
      },
      {
        total_revenue: 32120.82,
        total_cost: 31692.546,
      },
      {
        total_revenue: 45164.6846,
        total_cost: 48700.7738,
      },
      {
        total_revenue: 299595.522966,
        total_cost: 323512.2831,
      },
      {
        total_revenue: 269874.0096,
        total_cost: 259278.4694,
      },
      {
        total_revenue: 141635.1,
        total_cost: 122278.303,
      },
      {
        total_revenue: 499556.5724,
        total_cost: 484932.9298,
      },
      {
        total_revenue: 901590.2336,
        total_cost: 872807.421,
      },
      {
        total_revenue: 13765.92,
        total_cost: 11884.5776,
      },
      {
        total_revenue: 106078.56,
        total_cost: 91581.1568,
      },
      {
        total_revenue: 501788.1977,
        total_cost: 487028.019,
      },
      {
        total_revenue: 930780.6807,
        total_cost: 901123.4412,
      },
      {
        total_revenue: 1769096.688,
        total_cost: 1302776.52,
      },
      {
        total_revenue: 1340419.942,
        total_cost: 948855.5654,
      },
      {
        total_revenue: 1540803.062,
        total_cost: 1070448.0406,
      },
      {
        total_revenue: 1415563.612,
        total_cost: 994452.7436,
      },
      {
        total_revenue: 1847818.628,
        total_cost: 1441739.3488,
      },
      {
        total_revenue: 507978.2959,
        total_cost: 514900.2306,
      },
      {
        total_revenue: 306177.9,
        total_cost: 309647.905,
      },
      {
        total_revenue: 302678.724,
        total_cost: 306109.0718,
      },
      {
        total_revenue: 136467.864,
        total_cost: 138014.4948,
      },
      {
        total_revenue: 621103.74,
        total_cost: 628142.893,
      },
      {
        total_revenue: 304012.6411,
        total_cost: 300784.6788,
      },
      {
        total_revenue: 1016529.018414,
        total_cost: 1086329.1312,
      },
      {
        total_revenue: 879827.938243,
        total_cost: 922795.7136,
      },
      {
        total_revenue: 943340.559788,
        total_cost: 1097036.6764,
      },
      {
        total_revenue: 878666.66366,
        total_cost: 918902.0608,
      },
      {
        total_revenue: 523630.1458,
        total_cost: 541217.7392,
      },
      {
        total_revenue: 869632.782451,
        total_cost: 910628.0486,
      },
      {
        total_revenue: 521898.261376,
        total_cost: 535377.26,
      },
      {
        total_revenue: 312250.8139,
        total_cost: 313439.0504,
      },
      {
        total_revenue: 509245.008992,
        total_cost: 525643.128,
      },
      {
        total_revenue: 310946.5762,
        total_cost: 313439.0504,
      },
      {
        total_revenue: 1042909.77803,
        total_cost: 1104823.982,
      },
      {
        total_revenue: 1291868.700375,
        total_cost: 1227603.1248,
      },
      {
        total_revenue: 1186494.850299,
        total_cost: 1133907.5592,
      },
      {
        total_revenue: 1217210.359959,
        total_cost: 1149204.7944,
      },
      {
        total_revenue: 1019657.001,
        total_cost: 965637.972,
      },
      {
        total_revenue: 1339997.254626,
        total_cost: 1294500.3808,
      },
      {
        total_revenue: 1254722.732292,
        total_cost: 1203391.8496,
      },
      {
        total_revenue: 1365852.378018,
        total_cost: 1286908.0032,
      },
      {
        total_revenue: 1234276.030375,
        total_cost: 1169226.1504,
      },
      {
        total_revenue: 3693678.025272,
        total_cost: 3029893.083,
      },
      {
        total_revenue: 3438478.860423,
        total_cost: 2827393.963,
      },
      {
        total_revenue: 3434256.941928,
        total_cost: 2804612.812,
      },
      {
        total_revenue: 4400592.8004,
        total_cost: 3727148.3301,
      },
      {
        total_revenue: 4009494.761841,
        total_cost: 3335278.1832,
      },
      {
        total_revenue: 3309673.216908,
        total_cost: 2642932.5243,
      },
      {
        total_revenue: 442477.086952,
        total_cost: 409329.8136,
      },
      {
        total_revenue: 501648.87506,
        total_cost: 464385.8704,
      },
      {
        total_revenue: 484051.518,
        total_cost: 447031.2438,
      },
      {
        total_revenue: 479071.900108,
        total_cost: 442842.196,
      },
      {
        total_revenue: 1448122.478985,
        total_cost: 1359313.828,
      },
      {
        total_revenue: 1348759.49754,
        total_cost: 1233254.5568,
      },
      {
        total_revenue: 1066766.61,
        total_cost: 970504.5096,
      },
      {
        total_revenue: 1587008.1825,
        total_cost: 1470980.7134,
      },
      {
        total_revenue: 2516857.314918,
        total_cost: 2553224.4518,
      },
      {
        total_revenue: 2347655.953454,
        total_cost: 2329311.9542,
      },
      {
        total_revenue: 2012447.775,
        total_cost: 1935910.1355,
      },
      {
        total_revenue: 1506377.6325,
        total_cost: 1415002.589,
      },
      {
        total_revenue: 1227910.08086,
        total_cost: 1243611.1712,
      },
      {
        total_revenue: 1071291.781192,
        total_cost: 1069619.7,
      },
      {
        total_revenue: 932039.589,
        total_cost: 890636.6702,
      },
      {
        total_revenue: 717825.9115,
        total_cost: 661024.9746,
      },
      {
        total_revenue: 1233938.87766,
        total_cost: 1257159.6874,
      },
      {
        total_revenue: 16897.08,
        total_cost: 12503.843,
      },
      {
        total_revenue: 61034.609624,
        total_cost: 45240.7584,
      },
      {
        total_revenue: 1949.4,
        total_cost: 1442.556,
      },
      {
        total_revenue: 39909.108385,
        total_cost: 29929.6712,
      },
      {
        total_revenue: 19083.69,
        total_cost: 14121.9255,
      },
      {
        total_revenue: 22008.268728,
        total_cost: 17106.067,
      },
      {
        total_revenue: 51753.705952,
        total_cost: 40276.5125,
      },
      {
        total_revenue: 34375.348,
        total_cost: 26699.95,
      },
      {
        total_revenue: 5422.5375,
        total_cost: 4212.2454,
      },
      {
        total_revenue: 43395.5968,
        total_cost: 33695.3369,
      },
      {
        total_revenue: 107557.584,
        total_cost: 95511.1202,
      },
      {
        total_revenue: 22462.844954,
        total_cost: 16640.9836,
      },
      {
        total_revenue: 33360.39,
        total_cost: 24686.6886,
      },
      {
        total_revenue: 39988.638,
        total_cost: 29591.601,
      },
      {
        total_revenue: 79354.0398,
        total_cost: 58670.5028,
      },
      {
        total_revenue: 112286.412,
        total_cost: 83091.9222,
      },
      {
        total_revenue: 303330.8412,
        total_cost: 323043.806,
      },
      {
        total_revenue: 18005.274,
        total_cost: 13323.9096,
      },
      {
        total_revenue: 119892.15675,
        total_cost: 89180.6301,
      },
      {
        total_revenue: 166013.283557,
        total_cost: 123490.975,
      },
      {
        total_revenue: 58655.3702,
        total_cost: 43381.6852,
      },
      {
        total_revenue: 10574.784,
        total_cost: 7825.3376,
      },
      {
        total_revenue: 20238.1608,
        total_cost: 14902.2524,
      },
      {
        total_revenue: 14229.408,
        total_cost: 12635.7124,
      },
      {
        total_revenue: 129529.464,
        total_cost: 115022.1467,
      },
      {
        total_revenue: 200284.49776,
        total_cost: 178200.7087,
      },
      {
        total_revenue: 68167.5144,
        total_cost: 73271.3884,
      },
      {
        total_revenue: 485700.546949,
        total_cost: 517952.918,
      },
      {
        total_revenue: 301286.7891,
        total_cost: 320878.1492,
      },
      {
        total_revenue: 375026.9772,
        total_cost: 398703.0978,
      },
      {
        total_revenue: 89872.1736,
        total_cost: 94681.1278,
      },
      {
        total_revenue: 20364.997268,
        total_cost: 14030.9253,
      },
      {
        total_revenue: 16240.22,
        total_cost: 11209.6875,
      },
      {
        total_revenue: 13514.687276,
        total_cost: 9317.867,
      },
      {
        total_revenue: 45594.283686,
        total_cost: 31575.7684,
      },
      {
        total_revenue: 16017.33,
        total_cost: 11011.9255,
      },
      {
        total_revenue: 91330.800936,
        total_cost: 64094.0048,
      },
      {
        total_revenue: 17727.636,
        total_cost: 12187.7596,
      },
      {
        total_revenue: 94090.642908,
        total_cost: 65671.6082,
      },
      {
        total_revenue: 47214.369376,
        total_cost: 32517.9084,
      },
      {
        total_revenue: 86166.045931,
        total_cost: 59987.3744,
      },
      {
        total_revenue: 34178.202,
        total_cost: 23497.5297,
      },
      {
        total_revenue: 36490.550835,
        total_cost: 20040.5484,
      },
      {
        total_revenue: 54545.487338,
        total_cost: 31727.8152,
      },
      {
        total_revenue: 22912.259476,
        total_cost: 11687.2668,
      },
      {
        total_revenue: 11410.2965,
        total_cost: 7835.45,
      },
      {
        total_revenue: 48210.176172,
        total_cost: 34570.0054,
      },
      {
        total_revenue: 69943.214246,
        total_cost: 52936.3002,
      },
      {
        total_revenue: 156398.06795,
        total_cost: 100862.003,
      },
      {
        total_revenue: 90250.60055,
        total_cost: 54242.716,
      },
      {
        total_revenue: 12839.7,
        total_cost: 4916.043,
      },
      {
        total_revenue: 137164.127325,
        total_cost: 86277.0848,
      },
      {
        total_revenue: 57685.758,
        total_cost: 29814.8057,
      },
      {
        total_revenue: 136774.017063,
        total_cost: 84915.9172,
      },
      {
        total_revenue: 28654.163327,
        total_cost: 12718.8345,
      },
      {
        total_revenue: 20229.75,
        total_cost: 7566.0075,
      },
      {
        total_revenue: 15390.88,
        total_cost: 5756.2576,
      },
      {
        total_revenue: 8232.597632,
        total_cost: 3310.3725,
      },
      {
        total_revenue: 9387.149432,
        total_cost: 5201.4781,
      },
      {
        total_revenue: 13784.589952,
        total_cost: 8314.9679,
      },
      {
        total_revenue: 237096.156,
        total_cost: 142090.08,
      },
      {
        total_revenue: 18406.97208,
        total_cost: 9868.3827,
      },
      {
        total_revenue: 46619.58,
        total_cost: 17435.6805,
      },
      {
        total_revenue: 39591,
        total_cost: 14807.034,
      },
      {
        total_revenue: 105826.418334,
        total_cost: 56783.5543,
      },
      {
        total_revenue: 71606.07316,
        total_cost: 81273.8465,
      },
      {
        total_revenue: 21973.93,
        total_cost: 16919.9261,
      },
      {
        total_revenue: 98472.717334,
        total_cost: 118397.9104,
      },
      {
        total_revenue: 129145.570124,
        total_cost: 160635.3672,
      },
      {
        total_revenue: 232378.260212,
        total_cost: 232874.8119,
      },
      {
        total_revenue: 69127.13505,
        total_cost: 69548.4612,
      },
      {
        total_revenue: 52404.102,
        total_cost: 52351.7019,
      },
      {
        total_revenue: 49994.718,
        total_cost: 49944.7271,
      },
      {
        total_revenue: 323268.255972,
        total_cost: 324941.598,
      },
      {
        total_revenue: 68667.444,
        total_cost: 68598.7818,
      },
      {
        total_revenue: 74690.904,
        total_cost: 74616.2188,
      },
      {
        total_revenue: 324333.103309,
        total_cost: 326145.0854,
      },
      {
        total_revenue: 221720.952434,
        total_cost: 223246.9127,
      },
      {
        total_revenue: 25725.228,
        total_cost: 19036.6546,
      },
      {
        total_revenue: 63216.432,
        total_cost: 63153.2004,
      },
      {
        total_revenue: 42210.972,
        total_cost: 42168.7509,
      },
      {
        total_revenue: 800.208,
        total_cost: 799.4076,
      },
      {
        total_revenue: 3000.78,
        total_cost: 2997.7785,
      },
      {
        total_revenue: 58699.391208,
        total_cost: 58756.4586,
      },
      {
        total_revenue: 45611.856,
        total_cost: 45566.2332,
      },
      {
        total_revenue: 7201.872,
        total_cost: 7194.6684,
      },
      {
        total_revenue: 5001.3,
        total_cost: 4996.2975,
      },
      {
        total_revenue: 195826.389044,
        total_cost: 179238.7543,
      },
      {
        total_revenue: 136970.658,
        total_cost: 125008.5639,
      },
      {
        total_revenue: 41069.352,
        total_cost: 37482.6316,
      },
      {
        total_revenue: 15719.4,
        total_cost: 11632.356,
      },
      {
        total_revenue: 5636.957088,
        total_cost: 4178.3311,
      },
      {
        total_revenue: 12497.16716,
        total_cost: 9279.9588,
      },
      {
        total_revenue: 16392.096,
        total_cost: 12130.1718,
      },
      {
        total_revenue: 162.72,
        total_cost: 120.413,
      },
      {
        total_revenue: 4232.256,
        total_cost: 3131.8748,
      },
      {
        total_revenue: 1480.752,
        total_cost: 1095.7583,
      },
      {
        total_revenue: 1972.656,
        total_cost: 1459.7688,
      },
      {
        total_revenue: 13454.784,
        total_cost: 9956.5572,
      },
      {
        total_revenue: 100569.35722,
        total_cost: 92250.8444,
      },
      {
        total_revenue: 58777.53,
        total_cost: 53644.2998,
      },
      {
        total_revenue: 6970.92,
        total_cost: 6362.1272,
      },
      {
        total_revenue: 67332.75,
        total_cost: 61452.365,
      },
      {
        total_revenue: 15444.05,
        total_cost: 5776.1985,
      },
      {
        total_revenue: 9480.24,
        total_cost: 3545.7048,
      },
      {
        total_revenue: 7425.12,
        total_cost: 2777.0544,
      },
      {
        total_revenue: 63396.702,
        total_cost: 57860.055,
      },
      {
        total_revenue: 93584.422996,
        total_cost: 85490.625,
      },
      {
        total_revenue: 57851.364,
        total_cost: 52799.01,
      },
      {
        total_revenue: 2248.11,
        total_cost: 2051.775,
      },
      {
        total_revenue: 21541.38,
        total_cost: 8056.5106,
      },
      {
        total_revenue: 34818.39,
        total_cost: 13022.1243,
      },
      {
        total_revenue: 48860,
        total_cost: 18273.64,
      },
      {
        total_revenue: 22435.56,
        total_cost: 8390.9412,
      },
      {
        total_revenue: 23140.74,
        total_cost: 8654.6738,
      },
      {
        total_revenue: 27970.8,
        total_cost: 10461.0792,
      },
      {
        total_revenue: 27105.65,
        total_cost: 10137.5505,
      },
      {
        total_revenue: 10908.006,
        total_cost: 8071.9424,
      },
      {
        total_revenue: 12852.63,
        total_cost: 9510.96,
      },
      {
        total_revenue: 38018.3258,
        total_cost: 28228.286,
      },
      {
        total_revenue: 21087.192,
        total_cost: 15604.5568,
      },
      {
        total_revenue: 24624.894,
        total_cost: 18222.448,
      },
      {
        total_revenue: 32849.544,
        total_cost: 24308.6896,
      },
      {
        total_revenue: 7143.318,
        total_cost: 5286.0612,
      },
      {
        total_revenue: 1529.178,
        total_cost: 1395.6299,
      },
      {
        total_revenue: 1198.992,
        total_cost: 1094.28,
      },
      {
        total_revenue: 69934.27622,
        total_cost: 63910.4596,
      },
      {
        total_revenue: 44484.2678,
        total_cost: 33025.3608,
      },
      {
        total_revenue: 1548.624,
        total_cost: 1145.984,
      },
      {
        total_revenue: 12087.24,
        total_cost: 8944.562,
      },
      {
        total_revenue: 50299.311,
        total_cost: 37308.654,
      },
      {
        total_revenue: 44855.244,
        total_cost: 33192.8976,
      },
      {
        total_revenue: 10464.792,
        total_cost: 7743.9488,
      },
      {
        total_revenue: 148622.582216,
        total_cost: 110226.9628,
      },
      {
        total_revenue: 9377.710144,
        total_cost: 6955.6284,
      },
      {
        total_revenue: 635723.7159,
        total_cost: 619223.656,
      },
      {
        total_revenue: 1426372.869324,
        total_cost: 1489347.5895,
      },
      {
        total_revenue: 981187.8492,
        total_cost: 966223.5108,
      },
      {
        total_revenue: 667158.1488,
        total_cost: 588329.3463,
      },
      {
        total_revenue: 1518133.101147,
        total_cost: 1650878.8206,
      },
      {
        total_revenue: 290075.118375,
        total_cost: 316551.1328,
      },
      {
        total_revenue: 210946.176,
        total_cost: 222416.3936,
      },
      {
        total_revenue: 135284.008125,
        total_cost: 129665.9888,
      },
      {
        total_revenue: 358121.888775,
        total_cost: 392689.5248,
      },
      {
        total_revenue: 291747.26175,
        total_cost: 316551.1328,
      },
      {
        total_revenue: 196809.976125,
        total_cost: 209034.4944,
      },
      {
        total_revenue: 130898.5755,
        total_cost: 135203.3264,
      },
      {
        total_revenue: 351547.71141,
        total_cost: 389459.4112,
      },
      {
        total_revenue: 1586953.573023,
        total_cost: 1484901.7758,
      },
      {
        total_revenue: 1071401.058,
        total_cost: 961777.6971,
      },
      {
        total_revenue: 743353.026,
        total_cost: 612040.3527,
      },
      {
        total_revenue: 1721242.514355,
        total_cost: 1659770.448,
      },
      {
        total_revenue: 438867.47814,
        total_cost: 406271.1304,
      },
      {
        total_revenue: 286218.66,
        total_cost: 243158.5576,
      },
      {
        total_revenue: 772302.0123,
        total_cost: 762702.308,
      },
      {
        total_revenue: 1657198.182549,
        total_cost: 1598867.27,
      },
      {
        total_revenue: 1120066.364309,
        total_cost: 1021889.44,
      },
      {
        total_revenue: 694003.92,
        total_cost: 580225.36,
      },
      {
        total_revenue: 1774883.557085,
        total_cost: 1755831.22,
      },
      {
        total_revenue: 361145.312,
        total_cost: 306535.4432,
      },
      {
        total_revenue: 133365.033375,
        total_cost: 134741.8816,
      },
      {
        total_revenue: 348581.503515,
        total_cost: 388075.0768,
      },
      {
        total_revenue: 241773.758,
        total_cost: 178405.82,
      },
      {
        total_revenue: 323703.820668,
        total_cost: 259003.2728,
      },
      {
        total_revenue: 217457.874,
        total_cost: 161614.684,
      },
      {
        total_revenue: 227347.667276,
        total_cost: 168331.1384,
      },
      {
        total_revenue: 145089.432,
        total_cost: 138698.055,
      },
      {
        total_revenue: 141360.498,
        total_cost: 140239.1445,
      },
      {
        total_revenue: 122512.4316,
        total_cost: 117431.0199,
      },
      {
        total_revenue: 142897.2708,
        total_cost: 140855.5803,
      },
      {
        total_revenue: 161293.3452,
        total_cost: 158732.2185,
      },
      {
        total_revenue: 101734.116,
        total_cost: 83071.4754,
      },
      {
        total_revenue: 136293.476,
        total_cost: 114296.9236,
      },
      {
        total_revenue: 125925.668,
        total_cost: 103102.895,
      },
      {
        total_revenue: 157569.082,
        total_cost: 132266.2853,
      },
      {
        total_revenue: 96982.204,
        total_cost: 80125.6784,
      },
      {
        total_revenue: 12244.932,
        total_cost: 9061.2648,
      },
      {
        total_revenue: 39581.442,
        total_cost: 29290.2888,
      },
      {
        total_revenue: 290298.624,
        total_cost: 225434.1376,
      },
      {
        total_revenue: 578174.31287,
        total_cost: 534718.7776,
      },
      {
        total_revenue: 515666.906436,
        total_cost: 459803.1648,
      },
    ],
    columnMetadata: [
      {
        name: 'total_revenue',
        min_value: 513,
        max_value: 395182.6993,
        unique_values: 15,
        simple_type: 'number',
        type: 'float8',
      },
      {
        name: 'total_cost',
        min_value: 305.667,
        max_value: 422156.2212,
        unique_values: 15,
        simple_type: 'number',
        type: 'float8',
      },
    ],
  },
};

export const ProblematicDatasetWithLogarithmicRegression_DateXAxis: Story = {
  args: {
    ...ProblematicDatasetWithLinearRegression.args,
    trendlines: [
      {
        type: 'logarithmic_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Regression',
        columnId: 'total_revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
        trendLineColor: 'red',
      },
    ],
  },
};

export const ProblematicDatasetWithPolynomialRegression_DateXAxis: Story = {
  args: {
    ...ProblematicDatasetWithLinearRegression.args,
    trendlines: [
      {
        type: 'polynomial_regression',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Polynomial Regression',
        columnId: 'total_revenue',
        trendlineLabelPositionOffset: 15,
        projection: false,
        lineStyle: 'solid',
        offset: 0,
        polynomialOrder: 2,
        id: 'DEFAULT_ID',
        aggregateAllCategories: false,
        trendLineColor: 'red',
      },
    ],
  },
};
