import type { ChartConfigProps, DataMetadata } from '@buster/server-shared/metrics';
import { type ChartType, DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import type { BusterMetric, BusterMetricListItem } from '@/api/asset_interfaces/metric';

// Utility functions for predictable mock data generation
const CHART_TYPES: ChartType[] = ['bar', 'table', 'line', 'pie', 'scatter', 'metric'];

const PRODUCT_NAMES = [
  'Premium Widget',
  'Super Gadget',
  'Mega Tool',
  'Ultra Device',
  'Pro Instrument',
  'Advanced System',
];

const generatePredictableWords = (id: string, count: number): string => {
  const words = [
    'analytics',
    'metrics',
    'sales',
    'performance',
    'revenue',
    'growth',
    'trends',
    'insights',
  ];
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(words[(hash + i) % words.length]);
  }
  return result.join(' ');
};

const generatePredictableDate = (id: string): string => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const date = new Date(2024, 0, (hash % 28) + 1); // Generates a date in January 2024
  return date.toISOString();
};

const generatePredictableUUID = (id: string, salt = ''): string => {
  const hash = Array.from(id + salt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const segments = [8, 4, 4, 4, 12].map((length, index) => {
    return Array.from({ length }, (_, i) => ((hash + index + i) % 16).toString(16)).join('');
  });
  return segments.join('-');
};

const generatePredictableEmail = (id: string): string => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const names = ['john', 'jane', 'bob', 'alice', 'charlie'];
  const domains = ['example.com', 'test.org', 'mock.net'];
  const name = names[hash % names.length];
  const domain = domains[(hash + 1) % domains.length];
  return `${name}.${hash % 100}@${domain}`;
};

const createMockChartConfig = (id: string): ChartConfigProps => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const chartType: ChartType = CHART_TYPES[hash % CHART_TYPES.length];

  return {
    ...DEFAULT_CHART_CONFIG,
    selectedChartType: chartType,
    barAndLineAxis: {
      x: ['date'],
      y: ['sales'],
      category: [],
      tooltip: null,
      colorBy: [],
    },
    pieChartAxis: {
      x: ['product'],
      y: ['sales'],
      tooltip: null,
    },
    scatterAxis: {
      x: ['date'],
      y: ['sales'],
      category: [],
      size: [],
      tooltip: null,
    },
    metricColumnId: 'sales',
    metricHeader: {
      columnId: 'sales',
      useValue: false,
      aggregate: 'sum',
    },
  };
};

const dataMetadata: DataMetadata = {
  column_count: 3,
  column_metadata: [
    {
      name: 'sales',
      min_value: 0,
      max_value: 1000,
      unique_values: 10,
      simple_type: 'number',
      type: 'integer',
    },
    {
      name: 'date',
      min_value: '2024-01-01',
      max_value: '2024-01-31',
      unique_values: 31,
      simple_type: 'date',
      type: 'date',
    },
    {
      name: 'product',
      min_value: 'Product A',
      max_value: 'Product Z',
      unique_values: 26,
      simple_type: 'text',
      type: 'text',
    },
  ],
  row_count: 10,
};

export const createMockMetric = (id: string): BusterMetric => {
  const chart_config = createMockChartConfig(id);

  return {
    name: `${id} - ${generatePredictableWords(id, 3)}`,
    version_number: 1,
    file_name: `${generatePredictableWords(id, 2)}.yml`,
    description:
      PRODUCT_NAMES[
        Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % PRODUCT_NAMES.length
      ],
    data_source_id: generatePredictableUUID(id, 'source'),
    time_frame: '1d',
    type: 'metric_file',
    chart_config: chart_config,
    error: null,
    data_metadata: dataMetadata,
    status: 'notRequested',
    evaluation_score: 'Moderate',
    versions: [],
    evaluation_summary: `Predictable evaluation summary for ${id} showing consistent performance metrics and data quality indicators.`,
    file: `
  metric:
    name: sales_performance
    description: Monthly sales performance by product
    source: sales_database
    refresh_interval: daily
    
  dimensions:
    - name: date
      type: date
      format: YYYY-MM-DD
    - name: product
      type: string
    - name: region 
      type: string
      
  measures:
    - name: sales_amount
      type: decimal
      aggregation: sum
    - name: units_sold
      type: integer
      aggregation: sum
      
  filters:
    - field: date
      operator: between
      value: [2024-01-01, 2024-12-31]
    - field: region
      operator: in
      value: [North, South, East, West]
      
  joins:
    - name: product_details
      type: left
      on: product_id
      
  sorting:
    - field: sales_amount
      direction: desc
      
  limit: 1000`,
    created_at: generatePredictableDate(id),
    updated_at: generatePredictableDate(id),
    sent_by_id: generatePredictableUUID(id, 'user'),
    sent_by_name: `User ${id}`,
    sent_by_avatar_url: `https://avatar.example.com/${id}`,
    sql: `WITH records AS (
    SELECT 
      response_time_id,
      interaction_id,
      agent_id,
      customer_id,
      channel,
      date
    FROM demo.response_times
    ORDER BY date ASC
    LIMIT 100
  )
  SELECT * FROM records;`,
    collections: [],
    dashboards: [],
    individual_permissions: [],
    public_expiry_date: '',
    public_enabled_by: '',
    publicly_accessible: false,
    public_password: '',
    permission: 'owner',
    id,
    workspace_sharing: 'none',
    workspace_member_count: 20,
  };
};

export const mockMetric1 = createMockMetric('number1');
export const mockMetric2 = createMockMetric('number2');
export const mockMetric3 = createMockMetric('number3');
export const mockMetric4 = createMockMetric('number4');
export const mockMetric5 = createMockMetric('number5');
export const mockMetric6 = createMockMetric('number6');
export const mockMetric7 = createMockMetric('number7');
export const mockMetric8 = createMockMetric('number8');
export const mockMetric9 = createMockMetric('number9');
export const mockMetric10 = createMockMetric('number10');
export const mockMetric11 = createMockMetric('number11');
export const mockMetric12 = createMockMetric('number12');
export const mockMetric13 = createMockMetric('number13');
export const mockMetric14 = createMockMetric('number14');
export const mockMetric15 = createMockMetric('number15');
export const mockMetric16 = createMockMetric('number16');
export const mockMetric17 = createMockMetric('number17');
export const mockMetric18 = createMockMetric('number18');
export const mockMetric19 = createMockMetric('number19');
export const mockMetric20 = createMockMetric('number20');
export const mockMetric21 = createMockMetric('number21');
export const mockMetric22 = createMockMetric('number22');
export const mockMetric23 = createMockMetric('number23');
export const mockMetric24 = createMockMetric('number24');
export const mockMetric25 = createMockMetric('number25');
export const mockMetric26 = createMockMetric('number26');
export const mockMetric27 = createMockMetric('number27');
export const mockMetric28 = createMockMetric('number28');
export const mockMetric29 = createMockMetric('number29');
export const mockMetric30 = createMockMetric('number30');

export const createMockListMetric = (id: string): BusterMetricListItem => ({
  id,
  name: PRODUCT_NAMES[
    Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % PRODUCT_NAMES.length
  ],
  last_edited: generatePredictableDate(id),
  dataset_name: `Dataset ${id}`,
  dataset_uuid: generatePredictableUUID(id, 'dataset'),
  created_by_id: generatePredictableUUID(id, 'user'),
  created_by_name: `User ${id}`,
  created_by_email: generatePredictableEmail(id),
  created_by_avatar: `https://avatar.example.com/${id}`,
  status: 'verified',
  is_shared: true,
});
