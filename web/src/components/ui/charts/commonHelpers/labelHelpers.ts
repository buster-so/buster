import { formatLabel } from '@/lib';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { DatasetOption } from '../chartHooks';

export const JOIN_CHARACTER = ' | ';

//NEW LABEL HELPERS

export const formatLabelForDataset = (
  dataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  return dataset.label
    .map<string>((item) => {
      const { key, value } = item;
      const columnLabelFormat = columnLabelFormats[key];
      return formatLabel(value || key, columnLabelFormat, !value);
    })
    .join(JOIN_CHARACTER);
};

export const formatLabelForPieLegend = (
  label: string,
  datasetLabel: string,
  isMultipleYAxis: boolean
) => {
  if (isMultipleYAxis) {
    return [label, datasetLabel].join(JOIN_CHARACTER);
  }
  return label;
};
