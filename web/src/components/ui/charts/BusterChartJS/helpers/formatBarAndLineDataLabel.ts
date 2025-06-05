import type { Context } from 'chartjs-plugin-datalabels';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { formatLabel } from '@/lib/columnFormatter';

export const formatBarAndLineDataLabel = (
  value: number,
  context: Context,
  percentageMode: false | 'stacked' | 'data-label',
  columnLabelFormat: ColumnLabelFormat
) => {
  if (!percentageMode) {
    return formatLabel(value, columnLabelFormat);
  }

  const shownDatasets = context.chart.data.datasets.filter((dataset) => !dataset.hidden);
  const hasMultipleDatasets = shownDatasets.length > 1;

  const useStackTotal = hasMultipleDatasets || percentageMode === 'stacked';

  const total: number = useStackTotal
    ? context.chart.$totalizer.stackTotals[context.dataIndex]
    : context.chart.$totalizer.seriesTotals[context.datasetIndex];
  const percentage = ((value as number) / total) * 100;

  return formatLabel(percentage, {
    ...columnLabelFormat,
    style: 'percent',
    columnType: 'number'
  });
};
