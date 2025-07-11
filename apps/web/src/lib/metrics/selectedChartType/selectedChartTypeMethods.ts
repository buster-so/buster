import omit from 'lodash/omit';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ChartType } from '@buster/server-shared/metrics';
import { CHART_ICON_LIST, ChartIconType, DETERMINE_SELECTED_CHART_TYPE_ORDER } from './config';
import type { SelectChartTypeProps } from './chartIcon.types';
import { DetermineSelectedChartTypeRecord } from './chartTypeMethodConfig';

export const getSelectedChartTypeIcon = ({
  selectedChartType,
  lineGroupType,
  barGroupType,
  barLayout,
  hasAreaStyle
}: Omit<SelectChartTypeProps, 'colors' | 'columnMetadata' | 'columnSettings' | 'selectedAxis'> & {
  hasAreaStyle: boolean;
}) => {
  return (
    DETERMINE_SELECTED_CHART_TYPE_ORDER.find((t) =>
      DetermineSelectedChartTypeRecord[t]({
        selectedChartType,
        lineGroupType,
        barGroupType,
        barLayout,
        hasAreaStyle
      })
    ) || ChartIconType.TABLE
  );
};

export const getSelectedChartTypeConfig = (
  props: Parameters<typeof getSelectedChartTypeIcon>[0]
) => {
  const icon = getSelectedChartTypeIcon(props);
  const config = CHART_ICON_LIST.find((x) => x.id === icon);
  return config;
};

const chartTypeMethod: Record<
  ChartIconType,
  () => Partial<ChartConfigProps> & {
    hasAreaStyle?: boolean;
  }
> = {
  [ChartIconType.TABLE]: () => ({ selectedChartType: 'table' }),
  [ChartIconType.PIE]: () => ({ selectedChartType: 'pie' }),
  [ChartIconType.COLUMN]: () => ({
    selectedChartType: 'bar',
    barLayout: 'vertical',
    barGroupType: 'group'
  }),
  [ChartIconType.STACKED_COLUMN]: () => ({
    selectedChartType: 'bar',
    barLayout: 'vertical',
    barGroupType: 'stack'
  }),
  [ChartIconType.RELATIVE_STACKED_COLUMN]: () => ({
    selectedChartType: 'bar',
    barLayout: 'vertical',
    barGroupType: 'percentage-stack'
  }),
  [ChartIconType.BAR]: () => ({
    selectedChartType: 'bar',
    barLayout: 'horizontal',
    barGroupType: 'group'
  }),
  [ChartIconType.STACKED_BAR]: () => ({
    selectedChartType: 'bar',
    barGroupType: 'stack',
    barLayout: 'horizontal'
  }),
  [ChartIconType.RELATIVE_STACKED_BAR]: () => ({
    selectedChartType: 'bar',
    barGroupType: 'percentage-stack',
    barLayout: 'horizontal'
  }),
  [ChartIconType.LINE]: () => ({
    selectedChartType: 'line',
    hasAreaStyle: false,
    lineGroupType: null
  }),
  [ChartIconType.AREA]: () => ({
    selectedChartType: 'line',
    hasAreaStyle: true,
    lineGroupType: null
  }),
  [ChartIconType.RELATIVE_AREA]: () => ({
    selectedChartType: 'line',
    hasAreaStyle: true,
    lineGroupType: 'percentage-stack'
  }),
  [ChartIconType.SCATTER]: () => ({ selectedChartType: 'scatter' }),
  [ChartIconType.COMBO]: () => ({ selectedChartType: 'combo' }),

  [ChartIconType.METRIC]: () => ({
    selectedChartType: 'metric'
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
  columnSettings: ChartConfigProps['columnSettings']
): Partial<ChartConfigProps> => {
  const fullRes = chartTypeMethod[chartIconType]();
  const hasAreaStyle = !!fullRes.hasAreaStyle;
  const resOmitted = omit(fullRes, 'hasAreaStyle');

  if (resOmitted.selectedChartType === 'line') {
    const newColumnSettings: ChartConfigProps['columnSettings'] = Object.fromEntries(
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
