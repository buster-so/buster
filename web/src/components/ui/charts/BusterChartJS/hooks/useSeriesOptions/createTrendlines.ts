import {
  DEFAULT_TRENDLINE_CONFIG,
  type BusterChartProps,
  type ChartEncodes
} from '@/api/asset_interfaces/metric';
import type {
  AggregateMultiple,
  TrendlineOptions,
  TrendlinePluginOptions
} from '../../core/plugins/chartjs-plugin-trendlines';
import { TypeToLabel } from '../../core/plugins/chartjs-plugin-trendlines/config';
import { formatLabel } from '@/lib/columnFormatter';
import { canSupportTrendlineRecord } from '../../core/plugins/chartjs-plugin-trendlines/canSupportTrendline';

export const createTrendlineOnSeries = ({
  trendlines,
  yAxisKey,
  datasetColor,
  columnLabelFormats,
  useAggregateTrendlines
}: {
  trendlines: BusterChartProps['trendlines'];
  yAxisKey: string;
  datasetColor?: string;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  useAggregateTrendlines?: boolean;
}): TrendlineOptions[] | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const relevantTrendlines = trendlines.filter((trendline) => {
    const { columnId, type, aggregateAllCategories } = trendline;
    return columnId === yAxisKey &&
      canSupportTrendlineRecord[type]?.(columnLabelFormats, trendline) &&
      useAggregateTrendlines
      ? aggregateAllCategories
      : !aggregateAllCategories;
  });

  if (relevantTrendlines.length === 0) return undefined;

  return relevantTrendlines
    .map(
      ({
        type,
        show,
        trendlineLabel,
        lineStyle,
        polynomialOrder,
        trendLineColor,
        showTrendlineLabel,
        columnId,
        projection,
        offset,
        trendlineLabelPositionOffset,
        ...rest
      }) => {
        return {
          type,
          show,
          projection,
          lineStyle,
          polynomialOrder,
          colorMax:
            trendLineColor === 'inherit'
              ? datasetColor || DEFAULT_TRENDLINE_CONFIG.trendLineColor
              : trendLineColor,
          colorMin:
            trendLineColor === 'inherit'
              ? datasetColor || DEFAULT_TRENDLINE_CONFIG.trendLineColor
              : trendLineColor,
          label: showTrendlineLabel
            ? {
                positionRatio: trendlineLabelPositionOffset,
                display: true,
                offset: offset ?? (type === 'logarithmic_regression' ? -3 : 0),
                text: (v) => {
                  let value: number | null = null;
                  if (type === 'average') {
                    value = v.averageY;
                  } else if (type === 'median') {
                    value = v.medianY;
                  } else if (type === 'max') {
                    value = v.maxY;
                  } else if (type === 'min') {
                    value = v.minY;
                  }

                  const formattedValue = value
                    ? formatLabel(value, columnLabelFormats[columnId])
                    : '';

                  const defaultLabel = trendlineLabel || TypeToLabel[type];
                  const labelContent =
                    !trendlineLabel && formattedValue
                      ? `${defaultLabel}: ${formattedValue}`
                      : defaultLabel;

                  return labelContent;
                }
              }
            : undefined
        } satisfies TrendlineOptions;
      }
    )
    .filter((trendline) => trendline.show);
};

export const createAggregrateTrendlines = ({
  trendlines,
  columnLabelFormats,
  selectedAxis
}: {
  selectedAxis: ChartEncodes;
  trendlines: BusterChartProps['trendlines'];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}): TrendlinePluginOptions | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const trendlineOptions = trendlines.reduce<AggregateMultiple[]>((acc, trendline) => {
    const result = createTrendlineOnSeries({
      trendlines: [trendline],
      yAxisKey: trendline.columnId,
      columnLabelFormats,
      useAggregateTrendlines: true
    });

    if (result && result[0]) {
      const isYAxis = selectedAxis.y.includes(trendline.columnId);
      acc.push({
        ...result[0],
        yAxisID: isYAxis ? 'y' : 'y2',
        yAxisKey: trendline.columnId
      });
    }

    return acc;
  }, []);

  return {
    aggregateMultiple: trendlineOptions
  };
};
