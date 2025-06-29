import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import type { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { generatePieChartData } from '../../../../mocks/chart/chartMocks';
import { BusterChart } from '../BusterChart';
import { sharedMeta } from './BusterChartShared';
import type { ColumnSettings } from '@/api/asset_interfaces';

type PieChartData = ReturnType<typeof generatePieChartData>;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Pie'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: 'pie',
    data: generatePieChartData(),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 0,
    className: 'w-[500px] h-[500px]'
  }
};

export const MultipleValues: Story = {
  args: {
    selectedChartType: 'pie',
    data: [
      { segment: 'A', value1: 30, value2: 45 },
      { segment: 'B', value1: 20, value2: 25 },
      { segment: 'C', value1: 50, value2: 30 }
    ],
    pieChartAxis: {
      x: ['segment'],
      y: ['value1', 'value2'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value1: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    pieDisplayLabelAs: 'number',
    pieDonutWidth: 20,
    className: 'w-[500px] h-[500px]'
  }
};

export const Donut: Story = {
  args: {
    selectedChartType: 'pie',
    data: generatePieChartData(),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 20,
    className: 'w-[500px] h-[500px]'
  }
};

export const DonutMultipleValues: Story = {
  args: {
    selectedChartType: 'pie',
    data: [
      { segment: 'A', value1: 30, value2: 45 },
      { segment: 'B', value1: 20, value2: 25 },
      { segment: 'C', value1: 50, value2: 30 }
    ],
    pieChartAxis: {
      x: ['segment'],
      y: ['value1', 'value2'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value1: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 10,
    className: 'w-[500px] h-[500px]'
  }
};

export const ResizableContainer: Story = {
  render: (args) => (
    <div className="h-[500px] min-h-[200px] w-[500px] min-w-[200px] resize overflow-auto rounded-lg border border-gray-200 p-4">
      <BusterChart {...args} className="h-full w-full" />
    </div>
  ),
  args: {
    selectedChartType: 'pie',
    data: generatePieChartData(),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'number',
    pieDonutWidth: 10,
    pieInnerLabelTitle: 'Total',
    pieInnerLabelAggregate: 'sum'
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story provides a resizable container. Drag the bottom-right corner to resize the chart.'
      }
    }
  }
};

const names = ['Zack', 'Peter', 'Mary', 'John', 'William', 'David', 'Thomas', 'Alice'];
const numbers = [42, 8, 73, 19, 56, 3, 91, 27, 64, 12, 38, 85];
const numbers2 = [17, 94, 32, 61, 8, 75, 43, 29, 52, 88, 13, 67];
const dates = [
  '2021-01-05',
  '2021-01-02',
  '2021-01-09',
  '2021-01-01',
  '2021-01-07',
  '2021-01-10',
  '2021-01-03',
  '2021-01-08',
  '2021-01-04',
  '2021-01-06'
];

export const WithSortingByKey: Story = {
  args: {
    selectedChartType: 'pie',
    data: Array.from({ length: 8 }, (_, index) => ({
      segment: names[index],
      value: numbers[index]
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    pieSortBy: 'key',
    columnMetadata: [
      {
        name: 'segment',
        simple_type: 'text',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'text'
      },
      {
        name: 'value',
        simple_type: 'number',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'number'
      }
    ]
  }
};

export const WithSortingByKeyWithDates: Story = {
  args: {
    selectedChartType: 'pie',
    data: Array.from({ length: 8 }, (_, index) => ({
      date: dates[index],
      value: numbers[index]
    })),
    pieChartAxis: {
      x: ['date'],
      y: ['value'],
      tooltip: null
    },
    pieSortBy: 'key',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date'
      } satisfies IColumnLabelFormat
    },
    columnMetadata: [
      {
        name: 'date',
        simple_type: 'date',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'date'
      },
      {
        name: 'value',
        simple_type: 'number',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'number'
      }
    ]
  }
};

export const WithSortingByValue: Story = {
  args: {
    ...WithSortingByKey.args!,
    pieSortBy: 'value'
  }
};

export const ShowLabelAsPercent: Story = {
  render: (args) => (
    <div className="h-[500px] min-h-[200px] w-[500px] min-w-[200px] resize overflow-auto rounded-lg border border-gray-200 p-4">
      <BusterChart {...args} className="h-full w-full" />
    </div>
  ),
  args: {
    selectedChartType: 'pie',
    data: Array.from({ length: 5 }, (_, index) => ({
      segment: names[index],
      value: numbers[index],
      value2: numbers2[index]
    })),
    pieSortBy: 'value',
    pieChartAxis: {
      x: ['segment'],
      y: ['value', 'value2'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',

        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 5,
    pieInnerLabelTitle: 'Total',
    pieShowInnerLabel: false,
    pieLabelPosition: 'inside',
    pieInnerLabelAggregate: 'sum'
  }
};

export const ManyValuesWithDataLabels: Story = {
  args: {
    selectedChartType: 'pie',
    columnSettings: {
      value: {
        showDataLabels: true
      } as ColumnSettings
    },
    columnLabelFormats: {
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    data: Array.from({ length: 50 }, (_, index) => ({
      segment: names[index],
      value: numbers[index]
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    pieDisplayLabelAs: 'number',
    pieLabelPosition: 'inside',
    pieDonutWidth: 0
  }
};

export const DataLabelsOutside: Story = {
  args: {
    selectedChartType: 'pie',
    data: Array.from({ length: 5 }, (_, index) => ({
      segment: names[index],
      value: numbers[index]
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',

        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieLabelPosition: 'outside'
  }
};

export const MinimumSlicePercentage: Story = {
  args: {
    selectedChartType: 'pie',
    data: [
      { segment: 'Major Segment', sales: 60 },
      { segment: 'Medium Segment', sales: 20 },
      { segment: 'Small Segment 1', sales: 8 },
      { segment: 'Small Segment 2', sales: 6 },
      { segment: 'Tiny Segment 1', sales: 3 },
      { segment: 'Tiny Segment 2', sales: 2 },
      { segment: 'Tiny Segment 3', sales: 1 }
    ],
    pieChartAxis: {
      x: ['segment'],
      y: ['sales'],
      tooltip: null
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string',
        prefix: 'PREFIX TEST: '
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        displayName: 'HUH?',
        prefix: 'PREFIX TEST2: '
      } satisfies IColumnLabelFormat
    },
    pieDisplayLabelAs: 'percent',
    pieMinimumSlicePercentage: 25,
    className: 'w-[500px] h-[500px]'
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the minimum slice percentage feature, which groups slices smaller than the specified percentage into an "Other" category.'
      }
    }
  }
};

export const WithLegendHeadline: Story = {
  args: {
    ...Default.args,
    showLegend: true,
    showLegendHeadline: 'average',
    pieDisplayLabelAs: 'number',
    pieDonutWidth: 40,
    columnLabelFormats: {
      ...Default.args!.columnLabelFormats,
      value: {
        ...Default.args!.columnLabelFormats!.value!,
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      }
    }
  }
};

export const MultipleValuesWithLegendHeadline: Story = {
  args: {
    ...MultipleValues.args,
    showLegend: true,
    showLegendHeadline: 'average',
    pieDisplayLabelAs: 'number'
  }
};
