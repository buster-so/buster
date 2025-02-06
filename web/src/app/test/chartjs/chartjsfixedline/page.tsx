'use client';

import { ColumnMetaData, DEFAULT_COLUMN_SETTINGS } from '@/api/buster_rest';
import {
  BusterChart,
  BusterChartProps,
  ChartType,
  IColumnLabelFormat,
  ViewType
} from '@/components/charts';
import { faker } from '@faker-js/faker';
import { Button, Checkbox, Select, Slider } from 'antd';
import { useMemo, useState } from 'react';

const chartData = [
  { date: '2024-01-01', sales: 100 },
  { date: '2024-02-01', sales: 200 },
  { date: '2024-03-01', sales: 300 },
  { date: '2024-04-01', sales: 250 },
  { date: '2024-05-01', sales: 400 },
  { date: '2024-06-01', sales: 350 },
  { date: '2024-07-01', sales: 450 },
  { date: '2024-08-01', sales: 500 },
  { date: '2024-09-01', sales: 550 },
  { date: '2024-10-01', sales: 600 },
  { date: '2024-11-01', sales: 650 },
  { date: '2024-12-01', sales: 700 }
];

const barAndLineAxis = {
  x: ['date'],
  y: ['sales'],
  category: []
};

const pieConfig = {
  x: ['date'],
  y: ['sales']
};

const scatterAxis = {
  x: ['date'],
  y: ['sales']
};

const comboConfig = {
  x: ['date'],
  y: ['sales'],
  y2: []
};

const columnLabelFormats: Record<string, IColumnLabelFormat> = {
  sales: {
    style: 'currency',
    currency: 'USD',
    columnType: 'number'
    //  displayName: 'This is a display that is really long just for testing to make sure it works'
  },
  date: { style: 'date', dateFormat: undefined, columnType: 'date' }
};

const columnSettings: BusterChartProps['columnSettings'] = {
  sales: {
    ...DEFAULT_COLUMN_SETTINGS,
    // columnVisualization: 'bar',
    // showDataLabels: false,
    // barRoundness: 7,
    // showDataLabelsAsPercentage: false,
    lineSymbolSize: 3
    // lineStyle: 'line',
    // lineType: 'normal',
    // lineWidth: 2
  }
};

const columnMetadata: ColumnMetaData[] = Object.entries({
  ...chartData[0]
}).map(([key, value]) => ({
  name: key,
  min_value: 100,
  max_value: 190,
  unique_values: 1000,
  simple_type: typeof value === 'number' ? 'number' : 'text',
  type: typeof value as 'text'
}));

export default function ChartjsFixedLine() {
  const [numberOfPoints, setNumberOfPoints] = useState(10);
  const [useGeneratedData, setUseGeneratedData] = useState<'static' | 'generated' | 'multi-year'>(
    'static'
  );
  const [rerenderNumber, setRerenderNumber] = useState(1);

  const data = useMemo(() => {
    if (useGeneratedData === 'generated') {
      return Array.from({ length: numberOfPoints }, (_, index) => ({
        date: faker.date.past({ years: 1 }).toISOString(),
        sales: faker.number.int({ min: 590 + index, max: index + 10 + 590 })
      }));
    }

    if (useGeneratedData === 'multi-year') {
      return Array.from({ length: numberOfPoints }, (_, index) => ({
        date: faker.date.past({ years: 5 }).toISOString(),
        sales: faker.number.int({ min: 590 + index, max: index + 10 + 590 })
      }));
    }

    return chartData;
  }, [numberOfPoints, useGeneratedData]);

  return (
    <div className="flex h-[1000px] w-[75vw] flex-col rounded bg-white">
      <div className="h-[500px] w-full p-3">
        <BusterChart
          key={rerenderNumber}
          data={data}
          selectedChartType={ChartType.Line}
          selectedView={ViewType.Chart}
          loading={false}
          barAndLineAxis={barAndLineAxis}
          pieChartAxis={pieConfig}
          scatterAxis={scatterAxis}
          comboChartAxis={comboConfig}
          columnLabelFormats={columnLabelFormats}
          columnSettings={columnSettings}
          metricColumnId="sales"
          columnMetadata={columnMetadata}
          renderType="chartjs"
        />
      </div>

      <div className="flex w-full flex-col space-y-2 p-3">
        <Select
          value={useGeneratedData}
          onChange={setUseGeneratedData}
          options={[
            { label: 'Use 12 Month Interval Data', value: 'static' },
            { label: 'Use Multi-Year Data', value: 'multi-year' },
            { label: 'Use Random Same Year Data', value: 'generated' }
          ]}
        />
        <div className="flex w-full items-center space-x-2">
          <div>{numberOfPoints}</div>
          <Slider
            className="w-full"
            value={numberOfPoints}
            onChange={setNumberOfPoints}
            min={1}
            max={100}
          />
        </div>

        <Button onClick={() => setRerenderNumber(rerenderNumber + 1)}>
          Rerender {rerenderNumber}
        </Button>
      </div>
    </div>
  );
}
