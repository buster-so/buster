export type KV = { key: string; value: string | number | null };

export type DatasetOption = {
  id: string;
  /** One array of KV pairs per data point (here always length 1 in non-scatter mode) */
  label: KV[][];
  data: (number | null)[];
  dataKey: string;
  axisType: 'y' | 'y2';
  /** One array of KV pairs per data point */
  tooltipData: KV[][];
  sizeDataKey?: string | undefined;
  /** If you passed `axis.size`, one size value per data point */
  sizeData?: (number | null)[];
};
