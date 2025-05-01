import { BusterChartLegendItem } from './interfaces';
import { BusterChartProps, ShowLegendHeadline } from '@/api/asset_interfaces/metric/charts';
import { ArrayOperations } from '@/lib/math';
import { DatasetOptionsWithTicks } from '../chartHooks';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces/metric';
import { isDateColumnType } from '@/lib/messages';
import { formatLabel } from '@/lib/columnFormatter';

export const addLegendHeadlines = (
  legendItems: BusterChartLegendItem[],
  { datasets, ...rest }: DatasetOptionsWithTicks,
  showLegendHeadline: ShowLegendHeadline,
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  selectedChartType: IBusterMetricChartConfig['selectedChartType'],
  xAxisKeys: string[]
) => {
  const isScatterChart = selectedChartType === 'scatter';

  if (!showLegendHeadline || isScatterChart) return legendItems;

  // const hasMultipleXAxisDimensions = xAxisKeys.length > 1;
  // const firstXAxisDimensionName = xAxisKeys[0];
  // const xIsDate = isDateColumnType(columnLabelFormats[firstXAxisDimensionName]?.columnType);
  //  const canUseRange = !hasMultipleXAxisDimensions && xIsDate;
  // let range: string;
  // if (canUseRange) {
  //   console.log(columnMetadata, firstXAxisDimensionName);
  //   const firstXAxisDimensionMetadata = columnMetadata.find(
  //     (metadata) => metadata.name === firstXAxisDimensionName
  //   );
  //   const { min_value, max_value } = firstXAxisDimensionMetadata || {};
  //   const minDate = createDayjsDate((min_value as string) || new Date());
  //   const maxDate = createDayjsDate((max_value as string) || new Date());

  //   const dateFormat = getBestDateFormat(minDate, maxDate);
  //   range = `${minDate.format(dateFormat)} - ${maxDate.format(dateFormat)}`;
  // }

  const isPieChart = selectedChartType === 'pie';

  legendItems.forEach((item, index) => {
    if (!item.data || !Array.isArray(item.data)) {
      item.headline = {
        type: showLegendHeadline,
        titleAmount: 0
      };
      return;
    }

    if (isPieChart) {
      const result = item.data[index % item.data.length] as number;
      const formattedResult = formatLabel(result, columnLabelFormats[item.yAxisKey]);
      const headline: BusterChartLegendItem['headline'] = {
        type: 'current',
        titleAmount: formattedResult
      };
      item.headline = headline;
      return;
    }

    const arrayOperations = new ArrayOperations(item.data as number[]);

    // Use the mapping to get the correct operation method
    const operationMethod = legendHeadlineToOperation[showLegendHeadline];
    if (!operationMethod) {
      console.warn(`Unknown operation: ${showLegendHeadline}`);
      item.headline = {
        type: showLegendHeadline,
        titleAmount: 0
      };
      return;
    }

    const result = operationMethod(arrayOperations);
    const formattedResult = formatLabel(result, columnLabelFormats[item.yAxisKey]);
    const headline: BusterChartLegendItem['headline'] = {
      type: showLegendHeadline,
      titleAmount: formattedResult
    };
    item.headline = headline;
  });

  return legendItems;
};

const legendHeadlineToOperation: Record<
  'current' | 'average' | 'total' | 'median' | 'min' | 'max',
  (arrayOperations: ArrayOperations) => number
> = {
  current: (arrayOperations) => arrayOperations.last(),
  average: (arrayOperations) => arrayOperations.average(),
  total: (arrayOperations) => arrayOperations.sum(),
  median: (arrayOperations) => arrayOperations.median(),
  min: (arrayOperations) => arrayOperations.min(),
  max: (arrayOperations) => arrayOperations.max()
};
