import {
  type ChartConfigProps,
  type DataMetadata,
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_CONFIG_ENTRIES,
} from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';
import { create } from 'mutative';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import {
  createDefaultBarAndLineAxis,
  createDefaultPieAxis,
  createDefaultScatterAxis,
} from './createDefaultAxis';
import { createDefaultColumnLabelFormats } from './createDefaultColumnFormats';
import { createDefaultColumnSettings } from './createDefaultColumnSettings';

const keySpecificHandlers: Partial<
  Record<
    keyof ChartConfigProps,
    (
      value: unknown,
      dataMetadata: DataMetadata | undefined,
      pieChartAxis: ChartConfigProps['pieChartAxis'] | undefined
    ) => unknown
  >
> = {
  colors: (value: unknown) => {
    //because colors can come from the org, we only define them if they are not already defined
    const colors = value as ChartConfigProps['colors'];
    if (colors && !isEmpty(colors)) return colors;
    if (colors && colors.length <= 3)
      return Array.from({ length: 3 }, (_, index) => colors[index % colors.length]);
  },
  scatterDotSize: (value: unknown) => {
    const scatterDotSize = value as ChartConfigProps['scatterDotSize'];
    if (isEmpty(scatterDotSize)) return DEFAULT_CHART_CONFIG.scatterDotSize;
    return scatterDotSize;
  },
  barAndLineAxis: (value: unknown, dataMetadata) => {
    const barAndLineAxis = value as ChartConfigProps['barAndLineAxis'];
    if (isEmpty(barAndLineAxis)) {
      return createDefaultBarAndLineAxis(dataMetadata?.column_metadata);
    }
    return {
      x: barAndLineAxis.x || DEFAULT_CHART_CONFIG.barAndLineAxis.x,
      y: barAndLineAxis.y || DEFAULT_CHART_CONFIG.barAndLineAxis.y,
      tooltip: barAndLineAxis.tooltip || DEFAULT_CHART_CONFIG.barAndLineAxis.tooltip,
      category: barAndLineAxis.category || DEFAULT_CHART_CONFIG.barAndLineAxis.category,
      colorBy: barAndLineAxis.colorBy || DEFAULT_CHART_CONFIG.barAndLineAxis.colorBy,
    };
  },
  pieChartAxis: (value: unknown, dataMetadata) => {
    const pieChartAxis = value as ChartConfigProps['pieChartAxis'];
    if (isEmpty(pieChartAxis)) return createDefaultPieAxis(dataMetadata?.column_metadata);
    return {
      x: pieChartAxis.x || DEFAULT_CHART_CONFIG.pieChartAxis.x,
      y: pieChartAxis.y || DEFAULT_CHART_CONFIG.pieChartAxis.y,
      tooltip: pieChartAxis.tooltip || DEFAULT_CHART_CONFIG.pieChartAxis.tooltip,
    };
  },
  scatterAxis: (value: unknown, dataMetadata) => {
    const scatterAxis = value as ChartConfigProps['scatterAxis'];
    if (isEmpty(scatterAxis)) return createDefaultScatterAxis(dataMetadata?.column_metadata);
    return {
      x: scatterAxis.x || DEFAULT_CHART_CONFIG.scatterAxis.x,
      y: scatterAxis.y || DEFAULT_CHART_CONFIG.scatterAxis.y,
      size: scatterAxis.size || DEFAULT_CHART_CONFIG.scatterAxis.size,
      tooltip: scatterAxis.tooltip || DEFAULT_CHART_CONFIG.scatterAxis.tooltip,
      category: scatterAxis.category || DEFAULT_CHART_CONFIG.scatterAxis.category,
    };
  },
  comboChartAxis: (value: unknown, dataMetadata) => {
    const comboChartAxis = value as ChartConfigProps['comboChartAxis'];
    if (isEmpty(comboChartAxis)) return createDefaultBarAndLineAxis(dataMetadata?.column_metadata);
    return {
      x: comboChartAxis.x || DEFAULT_CHART_CONFIG.comboChartAxis.x,
      y: comboChartAxis.y || DEFAULT_CHART_CONFIG.comboChartAxis.y,
      y2: comboChartAxis.y2 || DEFAULT_CHART_CONFIG.comboChartAxis.y2,
      tooltip: comboChartAxis.tooltip || DEFAULT_CHART_CONFIG.comboChartAxis.tooltip,
      category: comboChartAxis.category || DEFAULT_CHART_CONFIG.comboChartAxis.category,
      colorBy: comboChartAxis.colorBy || DEFAULT_CHART_CONFIG.comboChartAxis.colorBy,
    };
  },
  metricColumnId: (value: unknown, dataMetadata) => {
    const metricColumnId = value as ChartConfigProps['metricColumnId'];
    if (isEmpty(metricColumnId)) {
      const firstNumberColumn = dataMetadata?.column_metadata?.find(
        (m) => m.simple_type === 'number'
      );
      return firstNumberColumn?.name || dataMetadata?.column_metadata?.[0]?.name || '';
    }
    return metricColumnId;
  },
  metricHeader: (value: unknown) => {
    const metricHeader = value as ChartConfigProps['metricHeader'];
    if (isEmpty(metricHeader)) return DEFAULT_CHART_CONFIG.metricHeader;
    return metricHeader;
  },
  metricSubHeader: (value: unknown) => {
    const metricSubHeader = value as ChartConfigProps['metricSubHeader'];
    if (isEmpty(metricSubHeader)) return DEFAULT_CHART_CONFIG.metricSubHeader;
    return metricSubHeader;
  },
  columnLabelFormats: (value: unknown, dataMetadata) => {
    const columnLabelFormats = value as ChartConfigProps['columnLabelFormats'];
    const result = createDefaultColumnLabelFormats(
      columnLabelFormats,
      dataMetadata?.column_metadata
    );
    return result;
  },
  columnSettings: (value: unknown, dataMetadata) => {
    const columnSettings = value as ChartConfigProps['columnSettings'];
    return createDefaultColumnSettings(columnSettings, dataMetadata?.column_metadata);
  },
  pieLabelPosition: (value: unknown) => {
    const pieLabelPosition = value as ChartConfigProps['pieLabelPosition'];
    // if (isEmpty(pieLabelPosition)) {
    //   const firstPieColumn = pieChartAxis?.x?.[0];
    //   const firstPieColumnMetaData = dataMetadata?.column_metadata?.find(
    //     ({ name }) => name === firstPieColumn
    //   );
    //   const hasMoreThanXRows = (firstPieColumnMetaData?.unique_values || 0) > 6;
    //   return !hasMoreThanXRows ? 'none' : 'none';
    // }
    return pieLabelPosition;
  },
};

export const createDefaultChartConfig = (
  message: Pick<BusterMetric, 'chart_config' | 'data_metadata'>
): ChartConfigProps => {
  const chartConfig: ChartConfigProps | undefined = message.chart_config;
  const dataMetadata = message.data_metadata;
  const pieChartAxis = chartConfig?.pieChartAxis;

  const newChartConfig = create(DEFAULT_CHART_CONFIG, (draft) => {
    for (const [_key, defaultValue] of DEFAULT_CHART_CONFIG_ENTRIES) {
      const key = _key as keyof ChartConfigProps;
      const chartConfigValue = chartConfig?.[key];

      const handler = keySpecificHandlers[key];

      if (!handler) {
        (draft as Record<string, unknown>)[key] = chartConfigValue ?? defaultValue;
        continue;
      }

      const result = handler(chartConfigValue, dataMetadata, pieChartAxis);

      (draft as Record<string, unknown>)[key] = result ?? defaultValue;
    }
  });

  return newChartConfig;
};
