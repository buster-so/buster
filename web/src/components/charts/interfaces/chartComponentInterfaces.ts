import { useDatasetOptions } from '../chartHooks';
import { ChartEncodes } from './axisInterfaces';
import { BusterChartProps } from './interfaces';

export interface BusterChartTypeComponentProps
  extends Omit<
    Required<BusterChartComponentProps>,
    | 'data'
    | 'renderType'
    | 'loading'
    | 'showLegend'
    | 'showLegendHeadline'
    | 'trendlines'
    | 'barSortBy'
    | 'onChartMounted'
  > {
  onChartReady: () => void;
}

export interface BusterChartComponentProps
  extends Omit<
      Required<BusterChartRenderComponentProps>,
      'renderType' | 'selectedAxis' | 'barSortBy' | 'trendlines' | 'data'
    >,
    ReturnType<typeof useDatasetOptions> {
  selectedAxis: ChartEncodes;
}

export interface BusterChartRenderComponentProps
  extends Omit<
    Required<BusterChartProps>,
    | 'metricColumnId'
    | 'metricHeader'
    | 'tableColumnOrder'
    | 'tableColumnWidths'
    | 'tableHeaderBackgroundColor'
    | 'tableHeaderFontColor'
    | 'tableColumnFontColor'
    | 'metricSubHeader'
    | 'metricValueAggregate'
    | 'metricValueLabel'
    | 'id'
    | 'bordered'
    | 'editable'
    | 'selectedView'
    | 'groupByMethod'
    | 'error'
    | 'pieChartAxis'
    | 'comboChartAxis'
    | 'scatterAxis'
    | 'barAndLineAxis'
  > {
  selectedAxis: ChartEncodes;
  data: NonNullable<BusterChartProps['data']>;
}
