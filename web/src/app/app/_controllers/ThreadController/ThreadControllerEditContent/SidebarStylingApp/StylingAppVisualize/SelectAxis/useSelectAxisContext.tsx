import { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/busterv2';
import type {
  ChartEncodes,
  YAxisConfig,
  XAxisConfig,
  CategoryAxisStyleConfig,
  Y2AxisConfig
} from '@/components/charts/interfaces';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { PropsWithChildren } from 'react';
import React from 'react';

export interface ISelectAxisContext
  extends Required<YAxisConfig>,
    Required<Y2AxisConfig>,
    Required<XAxisConfig>,
    Required<CategoryAxisStyleConfig> {
  selectedAxis: ChartEncodes | null;
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'];
  columnMetadata: ColumnMetaData[];
  columnSettings: IBusterThreadMessageChartConfig['columnSettings'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  lineGroupType: IBusterThreadMessageChartConfig['lineGroupType'];
  barGroupType: IBusterThreadMessageChartConfig['barGroupType'];
  showLegend: IBusterThreadMessageChartConfig['showLegend'];
  showLegendHeadline: IBusterThreadMessageChartConfig['showLegendHeadline'];
  gridLines: IBusterThreadMessageChartConfig['gridLines'];
  goalLines: IBusterThreadMessageChartConfig['goalLines'];
  trendlines: IBusterThreadMessageChartConfig['trendlines'];
  barShowTotalAtTop: IBusterThreadMessageChartConfig['barShowTotalAtTop'];
  disableTooltip: IBusterThreadMessageChartConfig['disableTooltip'];
}

const SelectAxisContext = createContext<ISelectAxisContext>({} as ISelectAxisContext);

export const SelectAxisProvider: React.FC<PropsWithChildren<ISelectAxisContext>> = ({
  children,
  ...props
}) => {
  return <SelectAxisContext.Provider value={props}>{children}</SelectAxisContext.Provider>;
};

export const useSelectAxisContextSelector = <T,>(
  selector: ContextSelector<ISelectAxisContext, T>
) => useContextSelector(SelectAxisContext, selector);
