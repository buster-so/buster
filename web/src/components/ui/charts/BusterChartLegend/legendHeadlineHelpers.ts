import { BusterChartLegendItem } from './interfaces';
import { BusterChartProps, ShowLegendHeadline } from '@/api/asset_interfaces/metric/charts';
import { DataFrameOperations } from '@/lib/math';
import { formatLabel } from '@/lib/columnFormatter';
import { DatasetOptionsWithTicks, extractFieldsFromChain } from '../chartHooks';
import { createDayjsDate, getBestDateFormat } from '@/lib/date';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces/metric';

export const addLegendHeadlines = (
  legendItems: BusterChartLegendItem[],
  { datasets }: DatasetOptionsWithTicks,
  showLegendHeadline: ShowLegendHeadline,
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  selectedChartType: IBusterMetricChartConfig['selectedChartType']
) => {
  if (!showLegendHeadline) return legendItems;
  const lastDataset = datasets[datasets.length - 1];
  const dimensionNames = lastDataset.dimensions!;
  const source = lastDataset.source as [string | number, ...number[]][];
  const indexOfXAxis = 0;
  const xAxisDimensionNames = extractFieldsFromChain(dimensionNames[indexOfXAxis] as string);
  const hasMultipleXAxisDimensions = xAxisDimensionNames.length > 1;
  const firstXAxisDimensionName = xAxisDimensionNames[0]?.key;
  const firstXAxisDimensionMetadata = columnMetadata.find(
    (metadata) => metadata.name === firstXAxisDimensionName
  );
  const canUseRange =
    !hasMultipleXAxisDimensions && firstXAxisDimensionMetadata?.simple_type === 'date';

  let range: string;

  if (canUseRange) {
    const { min_value, max_value } = firstXAxisDimensionMetadata!;
    const minDate = createDayjsDate((min_value as string) || new Date());
    const maxDate = createDayjsDate((max_value as string) || new Date());

    const dateFormat = getBestDateFormat(minDate, maxDate);
    range = `${minDate.format(dateFormat)} - ${maxDate.format(dateFormat)}`;
  }
  const isPieChart = selectedChartType === 'pie';
  const isScatterChart = selectedChartType === 'scatter';

  legendItems.forEach((item, index) => {
    if (isPieChart) {
      const indexOfSeries = 1;
      const columnLabelName = extractFieldsFromChain(dimensionNames[indexOfSeries])[0]?.key;
      const assosciatedRow = source[index];
      const result = assosciatedRow?.[indexOfSeries]!;
      const formattedResult = formatLabel(result, columnLabelFormats[columnLabelName]);
      const legendHeadlineOption = 'current';
      const headline: BusterChartLegendItem['headline'] = {
        type: legendHeadlineOption,
        titleAmount: formattedResult
      };
      item.headline = headline;

      return;
    }

    if (isScatterChart) {
      return;
    }

    const indexOfDimension = dimensionNames.findIndex((dimension) => dimension === item.id);

    if (indexOfDimension === -1) {
      console.warn('TODO - fix this bug');
      return;
    }

    const columnLabelName = extractFieldsFromChain(item.id).at(-1)?.key!;

    const arrayOperations = new DataFrameOperations(source, indexOfDimension);
    const operation = legendHeadlineToOperation[showLegendHeadline];
    const result = operation(arrayOperations);

    const formattedResult = formatLabel(result, columnLabelFormats[columnLabelName]);

    const headline: BusterChartLegendItem['headline'] = {
      type: showLegendHeadline,
      titleAmount: formattedResult,
      range
    };

    item.headline = headline;
  });

  return legendItems;
};

const legendHeadlineToOperation: Record<
  'current' | 'average' | 'total' | 'median' | 'min' | 'max',
  (arrayOperations: DataFrameOperations) => number
> = {
  current: (arrayOperations) => arrayOperations.last(),
  average: (arrayOperations) => arrayOperations.average(),
  total: (arrayOperations) => arrayOperations.sum(),
  median: (arrayOperations) => arrayOperations.median(),
  min: (arrayOperations) => arrayOperations.min(),
  max: (arrayOperations) => arrayOperations.max()
};
