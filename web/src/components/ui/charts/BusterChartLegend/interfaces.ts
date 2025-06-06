import type { ChartDataset } from 'chart.js';
import type { ChartType, ShowLegendHeadline } from '@/api/asset_interfaces/metric/charts';

export interface BusterChartLegendProps {
  animateLegend: boolean;
  legendItems: BusterChartLegendItem[];
  show?: boolean;
  containerWidth: number;
  showLegendHeadline: ShowLegendHeadline | undefined;
  onHoverItem?: (item: BusterChartLegendItem, isHover: boolean) => void;
  onClickItem?: (item: BusterChartLegendItem) => void;
  onFocusItem?: (item: BusterChartLegendItem) => void;
}

export interface BusterChartLegendItem {
  color: string;
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
  isUpdatingChart?: boolean;
  animateLegend: boolean;
}
