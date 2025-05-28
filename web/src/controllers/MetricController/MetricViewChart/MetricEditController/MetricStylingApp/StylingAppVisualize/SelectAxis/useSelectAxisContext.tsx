import type { ColumnMetaData, IBusterMetricChartConfig } from '@/api/asset_interfaces';
import type {
  CategoryAxisStyleConfig,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '@/api/asset_interfaces/metric/charts';
import type { PropsWithChildren } from 'react';
import type React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export interface ISelectAxisContext
  extends Required<YAxisConfig>,
    Required<Y2AxisConfig>,
    Required<Omit<XAxisConfig, 'xAxisTimeInterval'>>,
    Required<CategoryAxisStyleConfig> {
  selectedAxis: ChartEncodes | null;
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  columnMetadata: ColumnMetaData[];
  columnSettings: IBusterMetricChartConfig['columnSettings'];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  showLegend: IBusterMetricChartConfig['showLegend'];
  showLegendHeadline: IBusterMetricChartConfig['showLegendHeadline'];
  gridLines: IBusterMetricChartConfig['gridLines'];
  goalLines: IBusterMetricChartConfig['goalLines'];
  trendlines: IBusterMetricChartConfig['trendlines'];
  barShowTotalAtTop: IBusterMetricChartConfig['barShowTotalAtTop'];
  disableTooltip: IBusterMetricChartConfig['disableTooltip'];
  rowCount: number;
}

const SelectAxisContext = createContext<ISelectAxisContext>({} as ISelectAxisContext);

export const SelectAxisProvider: React.FC<PropsWithChildren<ISelectAxisContext>> = ({
  children,
  ...props
}) => {
  return <SelectAxisContext.Provider value={props}>{children}</SelectAxisContext.Provider>;
};

export const useSelectAxisContextSelector = <T,>(selector: (state: ISelectAxisContext) => T) =>
  useContextSelector(SelectAxisContext, selector);
