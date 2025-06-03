import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { SelectChartTypeProps } from './chartIcon.types';
import { ChartIconType } from './config';

export const DetermineSelectedChartTypeRecord: Record<
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
