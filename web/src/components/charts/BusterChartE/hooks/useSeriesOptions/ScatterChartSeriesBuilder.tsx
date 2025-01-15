import type {
  DefaultLabelFormatterCallbackParams,
  ScatterSeriesOption,
  DatasetComponentOption
} from 'echarts/types/dist/echarts';
import { BusterChartProps } from '../../../interfaces';
import { ChartEncodes, ScatterAxis } from '../../../interfaces';
import { DEFAULT_CHART_CONFIG } from '@/api/buster-rest/threads';
import isEmpty from 'lodash/isEmpty';
import { appendToKeyValueChain } from '../../../chartHooks';

let maxMinRecord: Record<string, [number, number, number]> = {};

export const ScatterChartSeriesBuilder = ({
  y,
  datasets,
  scatterDotSize = DEFAULT_CHART_CONFIG.scatterDotSize,
  selectedAxis
}: {
  y: string;
  index: number;
  datasets: DatasetComponentOption[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  scatterDotSize?: [number, number];
  selectedAxis: ChartEncodes;
}): ScatterSeriesOption[] => {
  const sizeAxis = (selectedAxis as ScatterAxis).size;
  const categories = (selectedAxis as ScatterAxis)?.category || [];
  const yAxis = (selectedAxis as ScatterAxis)?.y || [];

  //This will create the name (used in legend and tooltip)
  const nameCreator = (y: string, datasetId: string) => {
    if (categories.length === 0 && yAxis.length === 1) return datasetId;
    if (categories.length === 0 && yAxis.length !== 1)
      return appendToKeyValueChain({ key: y, value: null });
    if (categories.length === 1 && yAxis.length === 1) return datasetId;
    return appendToKeyValueChain({ key: y, value: null }, datasetId);
  };

  return datasets.map((dataset, datasetIndex) => {
    const name = nameCreator(y, dataset.id as string); //createMultipleHeaderFieldDelimiter(y, dataset.id as string); //There are multiple measures so we need to create a new series for each measure
    const [minValue, maxValue, sizeAxisIndex] = computeMaxAndMin(y, dataset, sizeAxis);

    return {
      name, //name is unique because it will color them differently, might mess with the tooltip
      type: 'scatter',
      datasetIndex,
      encode: {
        x: 0,
        y: [y]
      },
      symbolSize: function (dataItem: number[], params: DefaultLabelFormatterCallbackParams) {
        if (!isEmpty(sizeAxis)) {
          return computeSizeRatio(dataItem[sizeAxisIndex], minValue, maxValue, scatterDotSize);
        }
        return scatterDotSize[0] || DEFAULT_CHART_CONFIG.scatterDotSize[0];
      }
    };
  });
};

const computeMaxAndMin = (
  name: string,
  dataset: DatasetComponentOption,
  sizeAxisArray: ScatterAxis['size']
) => {
  let minValue = maxMinRecord[name]?.[0];
  let maxValue = maxMinRecord[name]?.[1];
  let sizeAxisIndex = maxMinRecord[name]?.[2] || (dataset.source as number[][])?.[0]?.length - 1;
  const sizeAxis = sizeAxisArray?.[0];

  //This feels like a hack...
  if (sizeAxis && !maxMinRecord[name]) {
    const source = dataset.source as number[][];
    sizeAxisIndex = dataset.dimensions!.indexOf(sizeAxis);

    // Single pass through data to find min/max
    let max: number = source[0][sizeAxisIndex];
    let min: number = source[0][sizeAxisIndex];

    for (let i = 1; i < source.length; i++) {
      const value = source[i][sizeAxisIndex];
      if (value > max) max = value;
      if (value < min) min = value;
    }
    maxValue = max;
    minValue = min;
    maxMinRecord[name] = [min, max, sizeAxisIndex];
  }

  return [minValue, maxValue, sizeAxisIndex];
};

const computeSizeRatio = (
  size: number,
  minValue: number,
  maxValue: number,
  scatterDotSize: [number, number]
) => {
  const lowRange = scatterDotSize[0];
  const highRange = scatterDotSize[1];

  if (minValue === maxValue) {
    return (lowRange + highRange) / 2;
  }

  const ratio = (size - minValue) / (maxValue - minValue);
  const computedSize = lowRange + ratio * (highRange - lowRange);

  return computedSize;
};
