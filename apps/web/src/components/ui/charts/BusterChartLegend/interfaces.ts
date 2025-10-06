import type { ChartType, ShowLegendHeadline } from '@buster/server-shared/metrics';
import type { ChartDataset } from 'chart.js';

export interface BusterChartLegendProps {
  animateLegend: boolean;
  legendItems: BusterChartLegendItem[];
  show?: boolean;
  containerWidth: number;
  showLegendHeadline: ShowLegendHeadline | undefined;
  onHoverItem?: ((item: BusterChartLegendItem, isHover: boolean) => void) | undefined;
  onClickItem?: ((item: BusterChartLegendItem) => void) | undefined;
  onFocusItem?: ((item: BusterChartLegendItem) => void) | undefined;
}

export interface BusterChartLegendItem {
  color: string | string[]; //will be string[] for colorBy
  inactive: boolean;
  type: ChartType;
  data: ChartDataset['data'];
  formattedName: string; //this is the formatted name
  id: string; //should be unique
  yAxisKey: string;
  serieName?: string;
  headline?: {
    type: ShowLegendHeadline;
    titleAmount: number | string;
    range?: string;
  };
}

export interface UseChartLengendReturnValues {
  legendItems: BusterChartLegendItem[];
  onHoverItem: (item: BusterChartLegendItem, isHover: boolean) => void;
  onLegendItemClick: (item: BusterChartLegendItem) => void;
  onLegendItemFocus: ((item: BusterChartLegendItem) => void) | undefined;
  showLegend: boolean;
  renderLegend: boolean;
  inactiveDatasets: Record<string, boolean>;
  isUpdatingChart: boolean;
  animateLegend: boolean;
}
