import type {
  BarSeriesOption,
  DatasetComponentOption,
  LabelFormatterCallback,
  LineSeriesOption,
  SeriesOption
} from 'echarts/types/dist/echarts';
import { BusterChartProps, ChartType } from '../../../interfaces';
import { BarAndLineAxis, ChartEncodes, ComboChartAxis } from '../../../interfaces/axisInterfaces';
import { ColumnSettings } from '../../../interfaces';
import { getYAxisColumnNames, seriesNameGenerator } from './helpers';
import { DEFAULT_COLUMN_SETTINGS } from '@/api/buster-rest';
import { formatLabel } from '@/utils';
import { createGradient } from './LineChartSeriesBuilder';

const columnVisualizationToSeriesType: Record<
  NonNullable<ColumnSettings['columnVisualization']>,
  'line' | 'bar'
> = {
  bar: ChartType.Bar,
  line: ChartType.Line,
  dot: ChartType.Line
};

export const ComboChartBuilder = ({
  y,
  columnLabelFormats,
  datasets,
  selectedAxis: selectedAxisProp,
  columnSettings,
  colors,
  index,
  isY2Axis
}: {
  y: string;
  datasets: DatasetComponentOption[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  colors: string[];
  index: number;
  isY2Axis?: boolean;
}): SeriesOption[] => {
  const selectedAxis = selectedAxisProp as ComboChartAxis;
  const selectedYs = isY2Axis && selectedAxis.y2 ? selectedAxis.y2 : selectedAxis.y;
  const yAxisColumnNames = getYAxisColumnNames(y, selectedYs);
  const firstYColumnName = yAxisColumnNames[0];
  const hasMultipleMeasures =
    selectedAxis.y?.length > 1 || ((selectedAxis as ComboChartAxis)?.y2?.length || 0) > 0;
  const hasMultipleCategories = selectedAxis.category?.length! > 1;

  //get column settings
  const columnSetting: ColumnSettings = columnSettings[firstYColumnName] || {};
  const selectedVisualization: NonNullable<ColumnSettings['columnVisualization']> =
    columnSetting.columnVisualization || 'bar';
  const seriesType = columnVisualizationToSeriesType[selectedVisualization];
  const isDotVisualization = selectedVisualization === 'dot';
  const isBarVisualization = selectedVisualization === 'bar';
  const isLineVisualization = selectedVisualization === 'line';

  //column label formatting
  const columnLabelFormat = columnLabelFormats[firstYColumnName];

  let comboSeries: BarSeriesOption | LineSeriesOption = {
    name: seriesNameGenerator(y, hasMultipleMeasures, hasMultipleCategories),
    yAxisIndex: isY2Axis ? 1 : 0,
    type: seriesType,
    datasetIndex: datasets.length - 1,
    encode: {
      x: 0,
      y
    }
  };

  if (isDotVisualization) {
    comboSeries = comboSeries as LineSeriesOption;
    comboSeries.lineStyle = {
      color: 'transparent'
    };
    comboSeries.symbol = 'circle';
    comboSeries.symbolSize = 10;
    comboSeries.showSymbol = true;
  } else if (isLineVisualization) {
    comboSeries = comboSeries as LineSeriesOption;
    comboSeries.lineStyle = {
      width: 2
    };
    comboSeries.symbolSize = columnSetting.lineSymbolSize || 0;
    comboSeries.showSymbol = true; //needed to show the symbol AND label
    comboSeries.smooth = columnSetting.lineType === 'smooth';
    comboSeries.step = columnSetting.lineType === 'step' ? 'start' : false;

    if (columnSetting.lineStyle === 'area') {
      comboSeries.areaStyle = {
        opacity: 0.2,
        color: createGradient(colors, index)
      };
    }
  }

  if (isBarVisualization) {
    const { barRoundness = DEFAULT_COLUMN_SETTINGS.barRoundness } = columnSetting;

    comboSeries = comboSeries as BarSeriesOption;
    comboSeries.itemStyle = {
      borderRadius: [barRoundness, barRoundness, 0, 0]
    };
  }

  const { showDataLabels } = columnSetting;

  comboSeries.label = {
    show: showDataLabels,
    formatter: (params: Parameters<LabelFormatterCallback>[0]) => {
      const { encode, data, dataIndex } = params;
      const value = (data as [string, ...number[]])[encode!.y[0]];
      return formatLabel(value, columnLabelFormat);
    }
  };

  return [comboSeries];
};

const comboGetColumnName = (y: string, selectedAxis: BarAndLineAxis) => {};
