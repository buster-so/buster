import omit from 'lodash/omit';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { ChartIconType } from './config';
import type { SelectChartTypeProps } from './SelectChartType';

export const DetermineSelectedChartType: Record<
  ChartIconType,
  (
    props: Omit<
      SelectChartTypeProps,
      'colors' | 'columnMetadata' | 'columnSettings' | 'selectedAxis'
    > & {
      hasAreaStyle: boolean;
    }
  ) => boolean
> = {
  [ChartIconType.TABLE]: ({ selectedChartType }) => {
    return selectedChartType === ChartType.Table;
  },
  [ChartIconType.COLUMN]: ({ barGroupType, selectedChartType, barLayout }) => {
    return (
      selectedChartType === ChartType.Bar && barLayout === 'vertical' && barGroupType === 'group'
    );
  },
  [ChartIconType.STACKED_COLUMN]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === ChartType.Bar && barLayout === 'vertical' && barGroupType === 'stack'
    );
  },
  [ChartIconType.RELATIVE_STACKED_COLUMN]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === ChartType.Bar &&
      barLayout === 'vertical' &&
      barGroupType === 'percentage-stack'
    );
  },
  [ChartIconType.LINE]: ({ selectedChartType, hasAreaStyle }) => {
    return selectedChartType === ChartType.Line && !hasAreaStyle;
  },
  [ChartIconType.COMBO]: ({ selectedChartType }) => {
    return selectedChartType === ChartType.Combo;
  },
  [ChartIconType.BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === ChartType.Bar && barLayout === 'horizontal' && barGroupType === 'group'
    );
  },
  [ChartIconType.STACKED_BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === ChartType.Bar && barGroupType === 'stack' && barLayout === 'horizontal'
    );
  },
  [ChartIconType.RELATIVE_STACKED_BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === ChartType.Bar &&
      barGroupType === 'percentage-stack' &&
      barLayout === 'horizontal'
    );
  },
  [ChartIconType.AREA]: ({ selectedChartType, hasAreaStyle, lineGroupType }) => {
    return selectedChartType === ChartType.Line && hasAreaStyle && lineGroupType === null;
  },
  [ChartIconType.RELATIVE_AREA]: ({ selectedChartType, hasAreaStyle, lineGroupType }) => {
    return (
      selectedChartType === ChartType.Line && lineGroupType === 'percentage-stack' && hasAreaStyle
    );
  },
  [ChartIconType.SCATTER]: ({ selectedChartType }) => selectedChartType === ChartType.Scatter,
  [ChartIconType.PIE]: ({ selectedChartType }) => selectedChartType === ChartType.Pie,
  [ChartIconType.METRIC]: ({ selectedChartType }) => selectedChartType === ChartType.Metric
};

const chartTypeMethod: Record<
  ChartIconType,
  () => Partial<IBusterMetricChartConfig> & {
    hasAreaStyle?: boolean;
  }
> = {
  [ChartIconType.TABLE]: () => ({ selectedChartType: ChartType.Table }),
  [ChartIconType.PIE]: () => ({ selectedChartType: ChartType.Pie }),
  [ChartIconType.COLUMN]: () => ({
    selectedChartType: ChartType.Bar,
    barLayout: 'vertical',
    barGroupType: 'group'
  }),
  [ChartIconType.STACKED_COLUMN]: () => ({
    selectedChartType: ChartType.Bar,
    barLayout: 'vertical',
    barGroupType: 'stack'
  }),
  [ChartIconType.RELATIVE_STACKED_COLUMN]: () => ({
    selectedChartType: ChartType.Bar,
    barLayout: 'vertical',
    barGroupType: 'percentage-stack'
  }),
  [ChartIconType.BAR]: () => ({
    selectedChartType: ChartType.Bar,
    barLayout: 'horizontal',
    barGroupType: 'group'
  }),
  [ChartIconType.STACKED_BAR]: () => ({
    selectedChartType: ChartType.Bar,
    barGroupType: 'stack',
    barLayout: 'horizontal'
  }),
  [ChartIconType.RELATIVE_STACKED_BAR]: () => ({
    selectedChartType: ChartType.Bar,
    barGroupType: 'percentage-stack',
    barLayout: 'horizontal'
  }),
  [ChartIconType.LINE]: () => ({
    selectedChartType: ChartType.Line,
    hasAreaStyle: false,
    lineGroupType: null
  }),
  [ChartIconType.AREA]: () => ({
    selectedChartType: ChartType.Line,
    hasAreaStyle: true,
    lineGroupType: null
  }),
  [ChartIconType.RELATIVE_AREA]: () => ({
    selectedChartType: ChartType.Line,
    hasAreaStyle: true,
    lineGroupType: 'percentage-stack'
  }),
  [ChartIconType.SCATTER]: () => ({ selectedChartType: ChartType.Scatter }),
  [ChartIconType.COMBO]: () => ({ selectedChartType: ChartType.Combo }),

  [ChartIconType.METRIC]: () => ({
    selectedChartType: ChartType.Metric
  })
};

const defaultDisableMethod = (
  ...[params]: Parameters<(typeof disableTypeMethod)[ChartIconType.TABLE]>
) => {
  const { hasNumericColumn, hasMultipleColumns, hasColumns } = params;
  return !hasNumericColumn || !hasMultipleColumns || !hasColumns;
};

export const disableTypeMethod: Record<
  ChartIconType,
  (d: {
    hasNumericColumn: boolean;
    hasMultipleColumns: boolean;
    hasColumns: boolean;
    hasMultipleNumericColumns: boolean;
  }) => boolean
> = {
  [ChartIconType.TABLE]: ({ hasColumns }) => !hasColumns,
  [ChartIconType.METRIC]: ({ hasColumns }) => !hasColumns,
  [ChartIconType.COLUMN]: defaultDisableMethod,
  [ChartIconType.STACKED_COLUMN]: defaultDisableMethod,
  [ChartIconType.RELATIVE_STACKED_COLUMN]: defaultDisableMethod,
  [ChartIconType.LINE]: defaultDisableMethod,
  [ChartIconType.COMBO]: defaultDisableMethod,
  [ChartIconType.BAR]: defaultDisableMethod,
  [ChartIconType.STACKED_BAR]: defaultDisableMethod,
  [ChartIconType.RELATIVE_STACKED_BAR]: defaultDisableMethod,
  [ChartIconType.AREA]: defaultDisableMethod,
  [ChartIconType.RELATIVE_AREA]: defaultDisableMethod,
  [ChartIconType.SCATTER]: defaultDisableMethod,
  [ChartIconType.PIE]: defaultDisableMethod
};

export const selectedChartTypeMethod = (
  chartIconType: ChartIconType,
  columnSettings: IBusterMetricChartConfig['columnSettings']
): Partial<IBusterMetricChartConfig> => {
  const fullRes = chartTypeMethod[chartIconType]();
  const hasAreaStyle = !!fullRes.hasAreaStyle;
  const resOmitted = omit(fullRes, 'hasAreaStyle');

  if (resOmitted.selectedChartType === ChartType.Line) {
    const newColumnSettings: IBusterMetricChartConfig['columnSettings'] = Object.fromEntries(
      Object.entries(columnSettings).map(([key, value]) => [
        key,
        {
          ...value,
          lineStyle: hasAreaStyle ? 'area' : 'line'
        }
      ])
    );
    resOmitted.columnSettings = newColumnSettings;
  }

  return resOmitted;
};
