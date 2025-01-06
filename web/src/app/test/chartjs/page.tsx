'use client';

import { ColumnMetaData, DEFAULT_COLUMN_SETTINGS } from '@/api/busterv2';
import {
  BusterChart,
  BusterChartProps,
  ChartType,
  IColumnLabelFormat,
  Trendline,
  ViewType
} from '@/components/charts';
import { faker } from '@faker-js/faker';
import { Checkbox, Select } from 'antd';
import { useMemo, useState } from 'react';

const tenDates = Array.from({ length: 7 }, () =>
  faker.date.past({ years: 3 }).toISOString()
).sort();
const categories = ['Red', 'Green', 'Yellow'];
const secondaryCategories = ['Category 1', 'Category 2', 'Category 3'];
const twoNames = Array.from({ length: 5 }, () => faker.person.fullName());
const data = twoNames.flatMap((name, nameIndex) =>
  categories.flatMap((category, categoryIndex) =>
    Array.from({ length: 1 }, () => ({
      name,
      category,
      sales: faker.number.int({ min: 100, max: 1000 }),
      expenses: faker.number.int({ min: 50, max: 150 }),
      date: faker.date.past({ years: 5 }).toISOString(),
      secondary: secondaryCategories[categoryIndex % secondaryCategories.length],
      employee_count: faker.number.int({ min: 10, max: 14 })
    }))
  )
);

const data2 = tenDates.flatMap((date, index) => {
  return twoNames.map((name, nameIndex) => ({
    date,
    sales: faker.number.int({ min: 100, max: 1000 }),
    expenses: faker.number.int({ min: 50, max: 150 }),
    name
  }));
});

const lineData = twoNames.flatMap((name, nameIndex) =>
  tenDates.map((date, index) => ({
    date,
    sales: faker.number.int({
      min: (nameIndex + 1) * 20 * 100 + index * 1.73,
      max: (nameIndex + 1) * 20 * 100 + index * 50
    }),
    expenses: faker.number.int({ min: 150, max: 3550 }),
    category: name
  }))
);

const scatterData = Array.from({ length: 150 }, (_, index) => ({
  employee_count: faker.number.int({ min: 10, max: 1520 }),
  sales: faker.number.int({ min: 10 + index, max: 50 + index }),
  name: faker.helpers.arrayElement(['John', 'Jane', 'Jim']),
  category: faker.helpers.arrayElement(categories),
  expenses: faker.number.int({ min: 1, max: 30 }),
  sizeSwag: faker.number.int({ min: 100, max: 190 }),
  date: faker.date.past({ years: 1.75 }).toISOString()
}));

const columnMetadata: ColumnMetaData[] = Object.entries({
  ...data[0],
  ...lineData[0],
  ...scatterData[0]
}).map(([key, value]) => ({
  name: key,
  min_value: 100,
  max_value: 190,
  unique_values: 1000,
  simple_type: typeof value === 'number' ? 'number' : 'text',
  type: typeof value as 'text'
}));

const columnSettings: BusterChartProps['columnSettings'] = {
  sales: {
    ...DEFAULT_COLUMN_SETTINGS,
    columnVisualization: 'bar',
    showDataLabels: true,
    barRoundness: 7,
    showDataLabelsAsPercentage: false,
    lineSymbolSize: 0,
    lineStyle: 'line',
    lineType: 'normal',
    lineWidth: 2
  },
  expenses: {
    ...DEFAULT_COLUMN_SETTINGS,
    columnVisualization: 'dot',
    showDataLabels: false,
    lineStyle: 'line',
    showDataLabelsAsPercentage: false
  },
  employee_count: { ...DEFAULT_COLUMN_SETTINGS, showDataLabels: false },
  sizeSwag: { ...DEFAULT_COLUMN_SETTINGS, showDataLabels: false }
};

const columnLabelFormats: Record<string, IColumnLabelFormat> = {
  sales: {
    style: 'currency',
    currency: 'USD',
    columnType: 'number'
    //  displayName: 'This is a display that is really long just for testing to make sure it works'
  },
  expenses: { style: 'currency', currency: 'EUR', columnType: 'number' },
  date: { style: 'date', dateFormat: undefined, columnType: 'date' },
  name: { style: 'string', columnType: 'string' },
  category: { style: 'string', columnType: 'string' },
  employee_count: {
    style: 'currency',
    currency: 'MXN',
    compactNumbers: false,
    columnType: 'number'
  },
  sizeSwag: { style: 'currency', currency: 'USD', columnType: 'number' }
};

export default function ChartJS() {
  const [category, setCategory] = useState<string[]>([]);
  const [type, setType] = useState<ChartType>(ChartType.Pie);
  const [yAxisScaleType, setYAxisScaleType] = useState<'linear' | 'log'>('linear');
  const [barLayout, setBarLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [gridLines, setGridLines] = useState<boolean>(true);
  const chartType: ChartType = type;

  const chartData = useMemo(() => {
    if (chartType === ChartType.Line || chartType === ChartType.Combo) {
      return lineData;
    }
    if (chartType === ChartType.Bar) {
      return data2;
    }
    return chartType === ChartType.Scatter ? scatterData : data;
  }, [chartType]);

  const barAndLineAxis = useMemo(() => {
    return {
      x: ['date'],
      y: ['sales'],
      category: []
      //  tooltip: ['sales', 'name', 'expenses']
    };
  }, [category]);

  const scatterAxis = useMemo(() => {
    return {
      x: ['employee_count'],
      y: ['sales'],
      //category: ['name']
      size: ['sizeSwag'] as [string]
      //   tooltip: ['sales']
    };
  }, [category]);

  const pieConfig = useMemo(() => {
    return {
      axis: {
        x: ['name'],
        y: ['sales', 'expenses'],
        tooltip: ['employee_count']
      },
      minimumPiePercentage: 5
    };
  }, []);

  const comboConfig = useMemo(() => {
    return {
      x: ['date'],
      y: ['sales', 'expenses'],
      y2: []
      //  y2: ['expenses']
      //   tooltip: ['sales', 'name', 'expenses']
    };
  }, []);

  const [labelPosition, setLabelPosition] = useState<'outside' | 'inside' | 'none'>('outside');
  const [displayLabelAs, setDisplayLabelAs] = useState<'number' | 'percent'>('percent');
  const [barSortBy, setBarSortBy] = useState<'desc' | 'asc'>('desc');
  const [lineGroupType, setLineGroupType] = useState<'stack' | 'percentage-stack' | null>('stack');
  const [trendlineType, setTrendlineType] = useState<Trendline['type']>('min');
  const [yAxisStartAxisAtZero, setYAxisStartAxisAtZero] = useState<boolean>(true);

  return (
    <div className="flex h-[1000px] w-[75vw] flex-col rounded bg-white">
      <div className="h-[500px] w-full p-3">
        <BusterChart
          data={chartData}
          selectedChartType={chartType as ChartType.Pie}
          selectedView={ViewType.Chart}
          loading={false}
          barAndLineAxis={barAndLineAxis}
          pieChartAxis={pieConfig.axis}
          scatterAxis={scatterAxis}
          comboChartAxis={comboConfig}
          columnLabelFormats={columnLabelFormats}
          scatterDotSize={[3, 15]}
          columnSettings={columnSettings}
          metricColumnId="sales"
          xAxisShowAxisLabel={true}
          yAxisShowAxisLabel={true}
          yAxisAxisTitle="Sales"
          columnMetadata={columnMetadata}
          pieInnerLabelAggregate="sum"
          pieMinimumSlicePercentage={5}
          pieLabelPosition={labelPosition}
          pieDisplayLabelAs={displayLabelAs}
          pieShowInnerLabel={true}
          showLegendHeadline={'average'}
          renderType="chartjs"
          showLegend={true}
          yAxisStartAxisAtZero={yAxisStartAxisAtZero}
          yAxisScaleType={yAxisScaleType}
          xAxisShowAxisTitle={true}
          barShowTotalAtTop={true}
          barGroupType={'stack'}
          barLayout={barLayout}
          barSortBy={[barSortBy]}
          gridLines={gridLines}
          lineGroupType={lineGroupType}
          goalLines={
            [
              //   { value: 500, showGoalLineLabel: true, goalLineLabel: 'Goal Line', show: true }
            ]
          }
          trendlines={
            [
              // {
              //   show: true,
              //   showTrendlineLabel: true,
              //   trendlineLabel: '',
              //   type: 'max',
              //   columnId: 'sales'
              // },
              // {
              //   show: false,
              //   showTrendlineLabel: true,
              //   trendlineLabel: '',
              //   type: 'min',
              //   columnId: 'sales'
              // },
              // {
              //   show: false,
              //   showTrendlineLabel: true,
              //   trendlineLabel: null,
              //   type: 'average',
              //   columnId: 'sales'
              // },
              // {
              //   show: false,
              //   showTrendlineLabel: true,
              //   trendlineLabel: null,
              //   type: 'median',
              //   columnId: 'sales'
              // },
              // {
              //   show: true,
              //   showTrendlineLabel: true,
              //   trendlineLabel: null,
              //   type: trendlineType,
              //   columnId: 'sales'
              // }
            ]
          }
        />
      </div>

      <div>
        <Select
          value={trendlineType}
          onChange={(value) => setTrendlineType(value)}
          options={[
            { label: 'Min', value: 'min' },
            { label: 'Max', value: 'max' },
            { label: 'Average', value: 'average' },
            { label: 'Median', value: 'median' },
            { label: 'Linear Regression', value: 'linear_regression' },
            { label: 'Exponential Regression', value: 'exponential_regression' },
            { label: 'Polynomial Regression', value: 'polynomial_regression' },
            { label: 'Logarithmic Regression', value: 'logarithmic_regression' }
          ]}
        />
        <Select
          value={labelPosition}
          onChange={(value) => setLabelPosition(value)}
          options={[
            { label: 'Outside', value: 'outside' },
            { label: 'Inside', value: 'inside' },
            { label: 'None', value: 'none' }
          ]}
        />
        <Select
          value={displayLabelAs}
          onChange={(value) => setDisplayLabelAs(value)}
          options={[
            { label: 'Number', value: 'number' },
            { label: 'Percent', value: 'percent' }
          ]}
        />
        <Select
          value={yAxisScaleType}
          onChange={(value) => setYAxisScaleType(value)}
          options={[
            { label: 'Linear', value: 'linear' },
            { label: 'Logarithmic', value: 'log' }
          ]}
        />
        <Select
          value={barLayout}
          onChange={(value) => setBarLayout(value)}
          options={[
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' }
          ]}
        />
        <Select
          value={barSortBy}
          onChange={(value) => {
            setBarSortBy(value);
          }}
          options={[
            { label: 'Descending', value: 'desc' },
            { label: 'Ascending', value: 'asc' }
          ]}
        />
        <Select
          value={lineGroupType}
          onChange={(value) => {
            //@ts-ignore
            if (value === 'none' || value === null) {
              setLineGroupType(null);
            } else {
              setLineGroupType(value);
            }
          }}
          options={[
            { label: 'Stack', value: 'stack' },
            { label: 'Percentage Stack', value: 'percentage-stack' },
            { label: 'None', value: 'none' }
          ]}
        />
        <div className="flex flex-row space-x-1">
          <div>Grid Lines</div>
          <Checkbox checked={gridLines} onChange={(e) => setGridLines(e.target.checked)} />
        </div>

        <div className="flex flex-row space-x-1">
          <div>Y Axis Start Axis At Zero</div>
          <Checkbox
            checked={yAxisStartAxisAtZero}
            onChange={(e) => setYAxisStartAxisAtZero(e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
