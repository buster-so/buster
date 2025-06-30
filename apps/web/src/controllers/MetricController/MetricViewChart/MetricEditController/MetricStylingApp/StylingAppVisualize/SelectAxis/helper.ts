import isEmpty from 'lodash/isEmpty';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { SelectAxisContainerId } from './config';
import type { DropZone } from './SelectAxisDragContainer/interfaces';

const EMPTY_ARRAY: string[] = []; //This is to avoid a reference change
const EMPTY_DROP_ZONE: DropZone[] = [
  // {
  //   id: SelectAxisContainerId.Available,
  //   title: '',
  //   items: EMPTY_ARRAY
  // }
];

export const ZoneIdToTitle: Record<SelectAxisContainerId, string> = {
  [SelectAxisContainerId.XAxis]: 'X-Axis',
  [SelectAxisContainerId.YAxis]: 'Y-Axis',
  [SelectAxisContainerId.Y2Axis]: 'Right Y-Axis',
  [SelectAxisContainerId.CategoryAxis]: 'Category',
  [SelectAxisContainerId.SizeAxis]: 'Size',
  [SelectAxisContainerId.Tooltip]: 'Tooltip',
  [SelectAxisContainerId.Available]: 'Available',
  [SelectAxisContainerId.Metric]: 'Metric'
};

const makeDropZone = (id: SelectAxisContainerId, items: string[]): DropZone => {
  return {
    id,
    title: ZoneIdToTitle[id],
    items
  };
};

const makeXAxisDropZone = (xItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.XAxis, xItems);

const makeYAxisDropZone = (yItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.YAxis, yItems);

const makeYComboAxisDropZone = (yItems: string[]): DropZone => {
  const res = makeDropZone(SelectAxisContainerId.YAxis, yItems);
  res.title = 'Left Y-Axis'; //🥺
  return res;
};

const makeCategoryAxisDropZone = (categoryItems: string[] | null | undefined): DropZone =>
  makeDropZone(SelectAxisContainerId.CategoryAxis, categoryItems ?? EMPTY_ARRAY);

const makeSizeAxisDropZone = (sizeItems: string[] | undefined): DropZone =>
  makeDropZone(
    SelectAxisContainerId.SizeAxis,
    !isEmpty(sizeItems) && sizeItems ? sizeItems : EMPTY_ARRAY
  );

const makeTooltipDropZone = (tooltipItems: string[] | null | undefined): DropZone =>
  makeDropZone(SelectAxisContainerId.Tooltip, tooltipItems ?? EMPTY_ARRAY);

const makeY2AxisDropZone = (y2Items: string[] | null | undefined): DropZone =>
  makeDropZone(SelectAxisContainerId.Y2Axis, y2Items ?? EMPTY_ARRAY);

export const chartTypeToDropZones: Record<
  IBusterMetricChartConfig['selectedChartType'],
  (selectedAxis: Parameters<typeof getChartTypeDropZones>[0]['selectedAxis']) => DropZone[]
> = {
  ['bar']: (selectedAxis) => {
    const _selectedAxis = selectedAxis as IBusterMetricChartConfig['barAndLineAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip)
    ];
  },
  ['line']: (selectedAxis) => {
    const _selectedAxis = selectedAxis as IBusterMetricChartConfig['barAndLineAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip)
    ];
  },
  ['scatter']: (selectedAxis) => {
    const _selectedAxis = selectedAxis as IBusterMetricChartConfig['scatterAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeSizeAxisDropZone(_selectedAxis.size),
      makeTooltipDropZone(_selectedAxis.tooltip)
    ];
  },
  ['pie']: (selectedAxis) => {
    const _selectedAxis = selectedAxis as IBusterMetricChartConfig['pieChartAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeTooltipDropZone(_selectedAxis.tooltip)
    ];
  },
  ['combo']: (selectedAxis) => {
    const _selectedAxis = selectedAxis as IBusterMetricChartConfig['comboChartAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYComboAxisDropZone(_selectedAxis.y),
      makeY2AxisDropZone(_selectedAxis.y2),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip)
    ];
  },
  //NOT ACUTALLY USED
  ['metric']: () => {
    return EMPTY_DROP_ZONE;
  },
  ['table']: () => {
    return EMPTY_DROP_ZONE;
  }
};

export const getChartTypeDropZones = ({
  chartType,
  selectedAxis
}: {
  chartType: IBusterMetricChartConfig['selectedChartType'];
  selectedAxis:
    | IBusterMetricChartConfig['comboChartAxis']
    | IBusterMetricChartConfig['pieChartAxis']
    | IBusterMetricChartConfig['scatterAxis']
    | IBusterMetricChartConfig['barAndLineAxis'];
}): DropZone[] => {
  return chartTypeToDropZones[chartType](selectedAxis);
};
