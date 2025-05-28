import type { DataMetadata, BusterMetricData } from '@/api/asset_interfaces/metric';

const PRODUCTS = [
  'Laptop',
  'Smartphone',
  'Tablet',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headphones',
  'Printer',
  'Camera',
  'Speaker'
];

const generateDate = (index: number): string => {
  const baseDate = new Date('2024-01-01');
  baseDate.setDate(baseDate.getDate() + index);
  return baseDate.toISOString();
};

const mockData = (length = 10): Record<string, string | number | null>[] => {
  return Array.from({ length }, (_, index) => ({
    sales: (index + 1) * 100,
    date: generateDate(index),
    product: PRODUCTS[index % PRODUCTS.length]
  }));
};

const dataMetadata: DataMetadata = {
  column_count: 3,
  column_metadata: [
    {
      name: 'sales',
      min_value: 100,
      max_value: 1000,
      unique_values: 10,
      simple_type: 'number',
      type: 'integer'
    },
    {
      name: 'date',
      min_value: '2024-01-01',
      max_value: '2024-01-31',
      unique_values: 31,
      simple_type: 'date',
      type: 'date'
    },
    {
      name: 'product',
      min_value: PRODUCTS[0],
      max_value: PRODUCTS[PRODUCTS.length - 1],
      unique_values: PRODUCTS.length,
      simple_type: 'text',
      type: 'text'
    }
  ],
  row_count: 1
};

const MOCK_DATA: Required<BusterMetricData> = {
  data: mockData(),
  metricId: 'mock-metric-1',
  data_metadata: dataMetadata
};

export const createMockData = (metricId: string): Required<BusterMetricData> => {
  const data = mockData();
  return {
    ...MOCK_DATA,
    metricId,
    data: data,
    data_metadata: {
      ...dataMetadata,
      row_count: data.length
    }
  };
};
