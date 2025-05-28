import type { Meta, StoryObj } from '@storybook/react';
import { BusterTableChart } from '../TableChart/BusterTableChart';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';

// Helper functions for generating sample data
const generateProductName = (index: number) => `Product ${index + 1}`;
const generateSales = (index: number) => Math.round(1000 + Math.sin(index) * 500);
const generateUnits = (index: number) => Math.round(100 + Math.cos(index) * 50);
const generateProfit = (index: number) =>
  Math.round((generateSales(index) * 0.3 + Math.random() * 200) * 100) / 100;
const generateDate = (index: number) => {
  const date = new Date('2024-01-01');
  date.setDate(date.getDate() + index);
  return date.toISOString();
};

// Generate table data
const generateTableData = (count = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    product: generateProductName(index),
    sales: generateSales(index),
    units: generateUnits(index),
    profit: generateProfit(index),
    date: generateDate(index)
  }));
};

const meta: Meta<typeof BusterTableChart> = {
  title: 'UI/Charts/BusterChart/BusterTableChart',
  component: BusterTableChart,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} as Meta<typeof BusterTableChart>;

export default meta;
type Story = StoryObj<typeof BusterTableChart>;

export const Default: Story = {
  args: {
    data: generateTableData(),
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        displayName: 'SALES'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[600px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};

export const WithTableColumnOrder: Story = {
  args: {
    data: generateTableData(),
    tableColumnOrder: ['product', 'units', 'profit', 'sales', 'date'],
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[600px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};

export const WithTableColumnWidths: Story = {
  args: {
    data: generateTableData(),
    tableColumnWidths: {
      product: 200,
      sales: 150,
      units: 100,
      profit: 150,
      date: 200
    },
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[600px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};

export const ReadOnly: Story = {
  args: {
    data: generateTableData(),
    readOnly: true,
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[600px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};

export const LargeDataset: Story = {
  args: {
    data: generateTableData(100),
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[600px] w-[800px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};

export const CustomClassname: Story = {
  args: {
    className: 'border-2 border-blue-500 rounded-lg',
    data: generateTableData(),
    columnLabelFormats: {
      product: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[400px] w-[600px]">
        <BusterTableChart {...args} />
      </div>
    );
  }
};
