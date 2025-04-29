export interface KV {
  key: string;
  value: string | number | boolean | object | null;
}

export type DatasetOption = {
  id: string;
  /** One array of KV pairs per data point (here always length 1 in non-scatter mode) */
  label: KV[][]; //the label is the category (or the y-axis value) of the data point. If there is only the y axis value, the "value" will be an empty string
  data: (number | null)[];
  dataKey: string;
  axisType: 'y' | 'y2';
  /** One array of KV pairs per data point */
  tooltipData: KV[][];
  sizeDataKey?: string | undefined;
  /** If you passed `axis.size`, one size value per data point */
  sizeData?: (number | null)[];
};

export type DatasetOptionsWithTicks = {
  ticks: string[][];
  ticksKey: KV[];
  datasets: DatasetOption[];
};
