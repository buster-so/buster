import type { Chart, ChartDataset } from 'chart.js';

export default interface OutLabelsContext {
  chart: Chart<'doughnut'>;
  dataIndex: number;
  dataset: ChartDataset<'doughnut', number[]>;
  labels: string[];
  datasetIndex: number;
  value: number;
  percent: number;
  display: boolean;
  formatter?: (value: number) => string;
  usePercent?: boolean;
}
