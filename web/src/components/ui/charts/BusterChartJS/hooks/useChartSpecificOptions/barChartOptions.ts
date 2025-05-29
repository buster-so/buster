import type { ChartType as ChartJSChartType } from 'chart.js';
import type { PluginChartOptions } from 'chart.js';
import type { DeepPartial } from 'utility-types';
import type { ChartProps } from '../../core';
import type { ChartSpecificOptionsProps } from './interfaces';

export const barOptionsHandler = (
  props: ChartSpecificOptionsProps
): ChartProps<ChartJSChartType>['options'] => {
  return {};
};

export const barPluginsHandler = ({
  barShowTotalAtTop,
  barGroupType,
  columnSettings
}: ChartSpecificOptionsProps): DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'] => {
  const hasShowLabelAsPercentage = Object.values(columnSettings || {}).some(
    (columnSetting) => columnSetting?.showDataLabelsAsPercentage
  );

  return {
    totalizer: {
      enabled: barShowTotalAtTop || hasShowLabelAsPercentage || !!barGroupType
    }
  };
};
