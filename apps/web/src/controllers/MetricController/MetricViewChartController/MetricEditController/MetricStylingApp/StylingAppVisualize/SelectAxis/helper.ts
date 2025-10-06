import type { ChartConfigProps } from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';
import { SelectAxisContainerId } from './config';
import type { DropZone } from './SelectAxisDragContainer/interfaces';

const EMPTY_ARRAY: string[] = []; //This is to avoid a reference change
const EMPTY_DROP_ZONE: DropZone[] = [];

export const ZoneIdToTitle: Record<SelectAxisContainerId, string> = {
  [SelectAxisContainerId.XAxis]: 'X-Axis',
  [SelectAxisContainerId.YAxis]: 'Y-Axis',
  [SelectAxisContainerId.Y2Axis]: 'Right Y-Axis',
  [SelectAxisContainerId.CategoryAxis]: 'Category',
  [SelectAxisContainerId.SizeAxis]: 'Size',
  [SelectAxisContainerId.Tooltip]: 'Tooltip',
  [SelectAxisContainerId.Available]: 'Available',
  [SelectAxisContainerId.Metric]: 'Metric',
  [SelectAxisContainerId.ColorBy]: 'Color By',
};

const makeDropZone = (
  id: SelectAxisContainerId,
  items: string[],
  overrideTitleId?: SelectAxisContainerId
): DropZone => {
  return {
    id,
    title: ZoneIdToTitle[overrideTitleId || id],
    items,
  };
};

const makeXAxisDropZone = (xItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.XAxis, xItems);

const makeReverseXAxisDropZone = (xItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.XAxis, xItems, SelectAxisContainerId.YAxis);

const makeYAxisDropZone = (yItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.YAxis, yItems);

const makeReverseYAxisDropZone = (yItems: string[]): DropZone =>
  makeDropZone(SelectAxisContainerId.YAxis, yItems, SelectAxisContainerId.XAxis);

const makeYComboAxisDropZone = (yItems: string[]): DropZone => {
  const res = makeDropZone(SelectAxisContainerId.YAxis, yItems);
  res.title = 'Left Y-Axis';
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

const makeColorByDropZone = (colorByItems: string[] | null | undefined): DropZone =>
  makeDropZone(SelectAxisContainerId.ColorBy, colorByItems ?? EMPTY_ARRAY);

export const chartTypeToDropZones: Record<
  ChartConfigProps['selectedChartType'],
  (
    selectedAxis: Parameters<typeof getChartTypeDropZones>[0]['selectedAxis'],
    barLayout: Parameters<typeof getChartTypeDropZones>[0]['barLayout']
  ) => DropZone[]
> = {
  bar: (selectedAxis, barLayout) => {
    const _selectedAxis = selectedAxis as ChartConfigProps['barAndLineAxis'];
    const isHorizontalBar = barLayout === 'horizontal';

    return [
      isHorizontalBar
        ? makeReverseYAxisDropZone(_selectedAxis.y)
        : makeXAxisDropZone(_selectedAxis.x),
      isHorizontalBar
        ? makeReverseXAxisDropZone(_selectedAxis.x)
        : makeYAxisDropZone(_selectedAxis.y),
      makeColorByDropZone(_selectedAxis.colorBy),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip),
    ];
  },
  line: (selectedAxis) => {
    const _selectedAxis = selectedAxis as ChartConfigProps['barAndLineAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeColorByDropZone(_selectedAxis.colorBy),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip),
    ];
  },
  scatter: (selectedAxis) => {
    const _selectedAxis = selectedAxis as ChartConfigProps['scatterAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeSizeAxisDropZone(_selectedAxis.size),
      makeTooltipDropZone(_selectedAxis.tooltip),
    ];
  },
  pie: (selectedAxis) => {
    const _selectedAxis = selectedAxis as ChartConfigProps['pieChartAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYAxisDropZone(_selectedAxis.y),
      makeTooltipDropZone(_selectedAxis.tooltip),
    ];
  },
  combo: (selectedAxis) => {
    const _selectedAxis = selectedAxis as ChartConfigProps['comboChartAxis'];
    return [
      makeXAxisDropZone(_selectedAxis.x),
      makeYComboAxisDropZone(_selectedAxis.y),
      makeY2AxisDropZone(_selectedAxis.y2),
      makeCategoryAxisDropZone(_selectedAxis.category),
      makeTooltipDropZone(_selectedAxis.tooltip),
    ];
  },
  //NOT ACUTALLY USED
  metric: () => {
    return EMPTY_DROP_ZONE;
  },
  table: () => {
    return EMPTY_DROP_ZONE;
  },
};

export const getChartTypeDropZones = ({
  chartType,
  selectedAxis,
  barLayout,
}: {
  chartType: ChartConfigProps['selectedChartType'];
  selectedAxis:
    | ChartConfigProps['comboChartAxis']
    | ChartConfigProps['pieChartAxis']
    | ChartConfigProps['scatterAxis']
    | ChartConfigProps['barAndLineAxis'];
  barLayout: ChartConfigProps['barLayout'];
}): DropZone[] => {
  return chartTypeToDropZones[chartType](selectedAxis, barLayout);
};
