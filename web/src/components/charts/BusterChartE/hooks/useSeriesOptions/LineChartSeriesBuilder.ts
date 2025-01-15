import type {
  DatasetComponentOption,
  LabelFormatterCallback,
  LineSeriesOption,
  SeriesOption
} from 'echarts';
import {
  BarAndLineAxis,
  BusterChartProps,
  ChartEncodes,
  ColumnLabelFormat
} from '../../../interfaces';
import isEmpty from 'lodash/isEmpty';
import { formatLabel } from '@/utils';
import { graphic } from 'echarts';
import set from 'lodash/set';
import { getYAxisColumnNames, seriesNameGenerator } from './helpers';
import { DEFAULT_COLUMN_SETTINGS } from '@/api/buster-rest';
import { yAxisSimilar } from '@/components/charts/commonHelpers';

type MarkPointOption = LineSeriesOption['markPoint'];

export const LineChartSeriesBuilder = ({
  columnLabelFormats,
  selectedAxis: selectedAxisProp,
  datasets,
  colors,
  index,
  columnSettings,
  yAxisKeys,
  barShowTotalAtTop,
  lineGroupType,
  y
}: {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  y: string;
  datasets: DatasetComponentOption[];
  selectedAxis: ChartEncodes;
  colors: string[];
  index: number;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  yAxisKeys: string[]; //this is the yAxisKeys array from the props
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  lineGroupType: BusterChartProps['lineGroupType'];
}): SeriesOption => {
  const selectedAxis = selectedAxisProp as BarAndLineAxis;
  const yAxisColumnNames = getYAxisColumnNames(y, selectedAxis.y);
  const firstColumnName = yAxisColumnNames[0];
  const firstColumnSettings = columnSettings[firstColumnName] || {};
  const isLastSeries = index === yAxisKeys.length - 1;
  const hasMultipleMeasures = selectedAxis.y.length > 1;
  const hasMultipleCategories = selectedAxis.category.length > 1;
  const isPercentageStack = lineGroupType === 'percentage-stack';

  const lineSeries: LineSeriesOption = {
    name: seriesNameGenerator(y, hasMultipleMeasures, hasMultipleCategories),
    type: 'line',
    datasetIndex: datasets.length - 1,
    encode: {
      x: 0,
      y: y
    }
  };

  const hasCategoryAxis = !isEmpty(selectedAxis.category);

  if (lineGroupType === 'stack' || isPercentageStack) {
    lineSeries.stack = '🥞';
  }

  if (firstColumnSettings.lineStyle === 'area' || lineGroupType === 'percentage-stack') {
    lineSeries.areaStyle = {
      opacity: 0.2,
      color: createGradient(colors, index)
    };
  }

  if (lineSeries.stack && (hasCategoryAxis || yAxisKeys.length > 1)) {
    if (barShowTotalAtTop) {
      const isLastSeries = index === yAxisKeys.length - 1;
      if (isLastSeries) {
        set(lineSeries, 'label.show', true);
      }
    }
  }

  //DATA LABELS - STACKED TOTAL AT THE TOP
  const showStackedTotal = isLastSeries && lineSeries.stack && barShowTotalAtTop;
  const showDataLabels = firstColumnSettings.showDataLabels ?? false;

  if (showStackedTotal) {
    const lastDataset = datasets[datasets.length - 1];
    const dimensionNames = lastDataset.dimensions! as string[];
    const yAxisKeyIndices = yAxisKeys.map((yAxisKey) => dimensionNames.indexOf(yAxisKey));
    const source = lastDataset.source as [string, ...number[]][];
    const hasMultipleY = selectedAxis.y.length > 1;
    const canUseSameYFormatter = hasMultipleY
      ? yAxisSimilar(selectedAxis.y, columnLabelFormats)
      : true;

    //calculate the totals for the stack so that we can place them on top of the lines
    const stackTotals: [string, number, string][] = source.map((row) => {
      const total = yAxisKeyIndices.reduce((acc, curr) => acc + Number(row[curr] || 0), 0);
      const columnFormat: ColumnLabelFormat = !canUseSameYFormatter
        ? { columnType: 'number', style: 'number' }
        : columnLabelFormats[firstColumnName as string];
      const formattedTotal = formatLabel(total, columnFormat, false);
      return [row[0], total, formattedTotal];
    });

    const markPoints: MarkPointOption = {
      silent: true,
      symbol: 'rect',
      label: {
        distance: showDataLabels ? 13 : -20,
        position: 'top',
        verticalAlign: 'middle',
        formatter: ({ dataIndex }) => stackTotals[dataIndex][2]
      },
      itemStyle: {
        color: 'transparent' //this will make the symbol transparent,
      },
      data: stackTotals.map(([date, total], index) => ({
        value: total,
        xAxis: date,
        yAxis: total,
        name: index.toString()
      }))
    };

    lineSeries.markPoint = markPoints;
  }

  //DATA LABELS - INDIVIDUAL LINE
  lineSeries.label = {
    show: showDataLabels,
    formatter: (params: Parameters<LabelFormatterCallback>[0]) => {
      const { encode, data, dataIndex, ...rest } = params;
      const value = (data as [string, ...number[]])[encode!.y[0]];
      if (isPercentageStack) {
        const columnLabelFormat: ColumnLabelFormat = { style: 'percent', columnType: 'number' };
        return formatLabel(value, columnLabelFormat, false);
      }
      return formatLabel(value, columnLabelFormats[firstColumnName as string], false);
    },
    position: isPercentageStack ? 'inside' : 'top'
  };

  //SYMBOL (DOT) SIZE  - DEFAULT FOUND IN THEME FILE - Dots on lines
  lineSeries.symbolSize =
    firstColumnSettings.lineSymbolSize || DEFAULT_COLUMN_SETTINGS.lineSymbolSize;
  lineSeries.showSymbol = !!lineSeries.symbolSize || showDataLabels; //needed to show the symbol AND label

  //LINE TYPE
  lineSeries.smooth = firstColumnSettings.lineType === 'smooth';
  lineSeries.step = firstColumnSettings.lineType === 'step' ? 'start' : false;

  //WIDTH AND STYLE - DEFAULT FOUND IN THEME FILE
  if (firstColumnSettings.lineWidth !== undefined) {
    lineSeries.lineStyle = {
      ...lineSeries.lineStyle,
      width: firstColumnSettings.lineWidth
    };
  }

  //TODO
  lineSeries.connectNulls = true;

  return lineSeries;
};

export const createGradient = (colors: string[], index: number) => {
  return new graphic.LinearGradient(0, 0, 0, 1, [
    {
      offset: 0,
      color: colors[index % colors.length]
    },
    {
      offset: 1,
      color: createColorPair(colors[index % colors.length])
    }
  ]);
};

const createColorPair = (color: string): string => {
  // Convert hex to RGB to manipulate colors
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Color pairing logic based on color ranges with more intense adjustments
  if (r > 200 && g > 200 && b < 100) {
    // Yellow -> add stronger orange tint
    return `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.max(0, g - 60)
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } else if (b > 180 && g > 180 && r < 150) {
    // Teal/Cyan -> add stronger blue tint
    return `#${r.toString(16).padStart(2, '0')}${Math.max(0, g - 50)
      .toString(16)
      .padStart(2, '0')}${Math.min(255, b + 30)
      .toString(16)
      .padStart(2, '0')}`;
  } else if (r > 200 && b > 150 && g < 150) {
    // Pink -> add stronger purple tint
    return `#${Math.max(0, r - 40)
      .toString(16)
      .padStart(2, '0')}${g.toString(16).padStart(2, '0')}${Math.min(255, b + 60)
      .toString(16)
      .padStart(2, '0')}`;
  } else if (g > 180 && r < 150 && b < 150) {
    // Green -> add stronger teal tint
    return `#${r.toString(16).padStart(2, '0')}${Math.max(0, g - 30)
      .toString(16)
      .padStart(2, '0')}${Math.min(255, b + 70)
      .toString(16)
      .padStart(2, '0')}`;
  } else if (b > 200 && r < 150 && g < 150) {
    // Blue -> add stronger purple tint
    return `#${Math.min(255, r + 70)
      .toString(16)
      .padStart(2, '0')}${g.toString(16).padStart(2, '0')}${Math.max(0, b - 30)
      .toString(16)
      .padStart(2, '0')}`;
  } else if (r > 200 && g < 150 && b < 150) {
    // Red -> add stronger pink tint
    return `#${Math.max(0, r - 30)
      .toString(16)
      .padStart(2, '0')}${g.toString(16).padStart(2, '0')}${Math.min(255, b + 70)
      .toString(16)
      .padStart(2, '0')}`;
  }

  // Default: Darken more and add stronger complementary tint
  return `#${Math.max(0, r - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, g - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, b - 40)
    .toString(16)
    .padStart(2, '0')}`;
};
