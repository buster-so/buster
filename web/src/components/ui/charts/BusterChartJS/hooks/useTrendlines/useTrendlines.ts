import { DATASET_IDS, TrendlineDataset } from '../../../chartHooks';
import type {
  BusterChartConfigProps,
  ChartType,
  Trendline
} from '@/api/asset_interfaces/metric/charts';
import type { AnnotationOptions, AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import { useMemo } from 'react';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import { formatLabel } from '@/lib';
import type { ChartProps } from '../../core';
import { TypeToLabel } from './config';

export const useTrendlines = ({
  trendlines,
  columnLabelFormats,
  selectedChartType,
  lineGroupType,
  barGroupType
}: {
  trendlines: TrendlineDataset[];
  selectedChartType: ChartType;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  lineGroupType: BusterChartConfigProps['lineGroupType'];
  barGroupType: BusterChartConfigProps['barGroupType'];
}): {
  trendlineAnnotations: AnnotationPluginOptions['annotations'];
  trendlineSeries: ChartProps<'line'>['data']['datasets'][number][];
} => {
  const canSupportTrendlines = useMemo(() => {
    if (selectedChartType === 'line') {
      return lineGroupType !== 'percentage-stack';
    }
    if (selectedChartType === 'bar') {
      return barGroupType !== 'percentage-stack';
    }
    return selectedChartType === 'scatter';
  }, [selectedChartType, lineGroupType, barGroupType]);

  const annotationTrendlines = useMemo(() => {
    if (!canSupportTrendlines) return [];
    return trendlines.filter(
      (trendline) => annotationTypes.includes(trendline.type) && trendline.show
    );
  }, [trendlines, canSupportTrendlines]);

  const seriesTrendlines = useMemo(() => {
    return trendlines.filter(
      (trendline) => !annotationTypes.includes(trendline.type) && trendline.show
    );
  }, [trendlines, canSupportTrendlines]);

  const trendlineAnnotations: AnnotationPluginOptions['annotations'] = useMemo(() => {
    return annotationTrendlines.reduce<Record<string, AnnotationOptions<'line'>>>(
      (acc, trendline) => {
        const name = trendline.type;
        const builderResult = annotationBuilder[name](trendline);
        const value = trendline.data[0] as number;
        const formattedValue = formatLabel(value, columnLabelFormats[trendline.columnId]);
        const trendlineLabel = trendline.trendlineLabel || TypeToLabel[trendline.type];
        const labelContent = trendlineLabel
          ? `${trendlineLabel}: ${formattedValue}`
          : formattedValue;

        return {
          ...acc,
          [name]: {
            ...builderResult,
            type: 'line',
            borderColor: trendline.trendLineColor || 'black',
            borderWidth: 1.5,
            label: {
              content: labelContent,
              display: trendline.showTrendlineLabel,
              ...defaultLabelOptionConfig
            },
            scaleID: 'y'
          }
        };
      },
      {}
    );
  }, [annotationTrendlines, canSupportTrendlines]);

  const trendlineSeries: ChartProps<'line'>['data']['datasets'][number][] = useMemo(() => {
    const series = seriesTrendlines.map<ChartProps<'line'>['data']['datasets'][number]>(
      ({
        id,
        data,
        trendLineColor,
        trendlineLabel: trendlineLabelProp,
        showTrendlineLabel,
        equation,
        tooltipData,
        columnId
      }) => {
        return {
          type: 'line',
          data: data.map((i) => i as number),
          borderColor: trendLineColor || 'black',
          borderWidth: 2,
          isTrendline: true,
          tooltipData,
          pointHoverRadius: 0,
          pointRadius: 0,
          xAxisKeys: [],
          yAxisKey: columnId,
          yAxisID: 'y',
          stack: id,
          tension: 0.25,
          order: -1,
          datalabels: showTrendlineLabel
            ? {
                ...defaultLabelOptionConfig,
                anchor: 'end',
                align: 'left',
                display: (context) => {
                  const datasetLength = context.dataset.data.length;
                  return context.dataIndex === datasetLength - 1;
                },
                formatter: () => {
                  const trendlineLabel = trendlineLabelProp ? trendlineLabelProp : equation;
                  return `${trendlineLabel}`;
                },
                yAdjust: -10
              }
            : undefined
        };
      }
    );

    return series;
  }, [seriesTrendlines, canSupportTrendlines]);

  return {
    trendlineAnnotations,
    trendlineSeries
  };
};

type TrendlineType = Trendline['type'];

const annotationTypes: TrendlineType[] = ['average', 'min', 'max', 'median'];

const annotationBuilder: Record<
  TrendlineType,
  (trendline: TrendlineDataset) => AnnotationOptions<'line'> | null
> = {
  average: (trendline) => ({
    type: 'line',
    value: trendline.data[0] as number
  }),
  min: (trendline) => ({
    type: 'line',
    value: trendline.data[0] as number
  }),
  max: (trendline) => ({
    type: 'line',
    value: trendline.data[0] as number
  }),
  median: (trendline) => ({
    type: 'line',
    value: trendline.data[0] as number
  }),
  linear_regression: (trendline) => {
    const isLinearSlope = trendline.trendlineLabel === DATASET_IDS.linearSlope(trendline.columnId);

    if (!isLinearSlope) {
      return null;
    }

    return null;
  },
  logarithmic_regression: (trendline) => {
    return null;
  },
  exponential_regression: (trendline) => {
    return null;
  },
  polynomial_regression: (trendline) => {
    return null;
  }
};
