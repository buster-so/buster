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
    return selectedChartType === 'table';
  },
  [ChartIconType.COLUMN]: ({ barGroupType, selectedChartType, barLayout }) => {
    return selectedChartType === 'bar' && barLayout === 'vertical' && barGroupType === 'group';
  },
  [ChartIconType.STACKED_COLUMN]: ({ selectedChartType, barLayout, barGroupType }) => {
    return selectedChartType === 'bar' && barLayout === 'vertical' && barGroupType === 'stack';
  },
  [ChartIconType.RELATIVE_STACKED_COLUMN]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === 'bar' && barLayout === 'vertical' && barGroupType === 'percentage-stack'
    );
  },
  [ChartIconType.LINE]: ({ selectedChartType, hasAreaStyle }) => {
    return selectedChartType === 'line' && !hasAreaStyle;
  },
  [ChartIconType.COMBO]: ({ selectedChartType }) => {
    return selectedChartType === 'combo';
  },
  [ChartIconType.BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return selectedChartType === 'bar' && barLayout === 'horizontal' && barGroupType === 'group';
  },
  [ChartIconType.STACKED_BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return selectedChartType === 'bar' && barGroupType === 'stack' && barLayout === 'horizontal';
  },
  [ChartIconType.RELATIVE_STACKED_BAR]: ({ selectedChartType, barLayout, barGroupType }) => {
    return (
      selectedChartType === 'bar' &&
      barGroupType === 'percentage-stack' &&
      barLayout === 'horizontal'
    );
  },
  [ChartIconType.AREA]: ({ selectedChartType, hasAreaStyle, lineGroupType }) => {
    return selectedChartType === 'line' && hasAreaStyle && lineGroupType === null;
  },
  [ChartIconType.RELATIVE_AREA]: ({ selectedChartType, hasAreaStyle, lineGroupType }) => {
    return selectedChartType === 'line' && lineGroupType === 'percentage-stack' && hasAreaStyle;
  },
  [ChartIconType.SCATTER]: ({ selectedChartType }) => selectedChartType === 'scatter',
  [ChartIconType.PIE]: ({ selectedChartType }) => selectedChartType === 'pie',
  [ChartIconType.METRIC]: ({ selectedChartType }) => selectedChartType === 'metric'
};
