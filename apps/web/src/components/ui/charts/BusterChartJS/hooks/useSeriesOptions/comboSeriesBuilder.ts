import {
  type ColumnSettings,
  DEFAULT_COLUMN_SETTINGS,
  ENABLED_DOTS_ON_LINE_SIZE
} from '@buster/server-shared/metrics';
import type { DatasetOption } from '../../../chartHooks';
import type { ChartProps } from '../../core';
import { barBuilder } from './barSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';
import { lineBuilder, lineSeriesBuilder_labels } from './lineSeriesBuilder';
import type { LabelBuilderProps } from './useSeriesOptions';

type ComboSeries = Array<
  ChartProps<'bar'>['data']['datasets'][number] | ChartProps<'line'>['data']['datasets'][number]
>;

export const comboSeriesBuilder_data = (props: SeriesBuilderProps): ComboSeries => {
  const { datasetOptions } = props;

  return datasetOptions.datasets.map((dataset, index) => {
    const renderResult = comboBuilder({
      ...props,
      dataset,
      index
    });
    return renderResult;
  });
};

type RenderBuilderProps = Pick<
  SeriesBuilderProps,
  | 'colors'
  | 'columnSettings'
  | 'columnLabelFormats'
  | 'xAxisKeys'
  | 'lineGroupType'
  | 'barGroupType'
  | 'trendlines'
> & {
  index: number;
  dataset: DatasetOption;
};

const comboBuilder = (
  props: RenderBuilderProps & {
    index: number;
  }
): ComboSeries[number] => {
  const { index, columnSettings, dataset } = props;
  const { axisType } = dataset;
  const yKey = dataset.dataKey;
  const columnSetting = columnSettings[yKey];
  const columnVisualization =
    columnSetting?.columnVisualization || DEFAULT_COLUMN_SETTINGS.columnVisualization;
  const renderProps = {
    ...props,
    index,
    yAxisID: axisType
  };

  const renderResult = renderBuilder[columnVisualization](renderProps);

  return renderResult;
};

const dotSeriesBuilder = (
  props: RenderBuilderProps
): ChartProps<'line'>['data']['datasets'][number] => {
  const { columnSettings, index } = props;
  const { dataset } = props;
  const { dataKey } = dataset;
  const uniqueColumnSetting = { ...columnSettings };
  const columnSetting = uniqueColumnSetting[dataKey] || DEFAULT_COLUMN_SETTINGS;
  columnSetting.lineWidth = 0;
  columnSetting.lineSymbolSize = ENABLED_DOTS_ON_LINE_SIZE;

  return lineBuilder({ ...props, order: -index, columnSettings: uniqueColumnSetting });
};

const renderBuilder: Record<
  Required<ColumnSettings>['columnVisualization'],
  (props: RenderBuilderProps) => ComboSeries[number]
> = {
  bar: barBuilder,
  line: (props) => lineBuilder({ ...props, order: -props.index }),
  dot: dotSeriesBuilder
};

export const comboSeriesBuilder_labels = (props: LabelBuilderProps): (string | Date)[] => {
  return lineSeriesBuilder_labels(props);
};
