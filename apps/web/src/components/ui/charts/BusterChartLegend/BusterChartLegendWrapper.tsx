import React from 'react';
import type { ShowLegendHeadline } from '@/api/asset_interfaces/metric/charts';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../../loaders';
import {
  ChartLegendWrapperProvider,
  useChartWrapperContextSelector
} from '../chartHooks/useChartWrapperProvider';
import { BusterChartLegend, type BusterChartLegendItem } from '.';
import { DownsampleAlert } from './DownsampleAlert';

export type BusterChartLegendWrapper = {
  children: React.ReactNode;
  renderLegend: boolean;
  legendItems: BusterChartLegendItem[];
  showLegend: boolean;
  showLegendHeadline: ShowLegendHeadline | undefined;
  inactiveDatasets: Record<string, boolean>;
  className: string | undefined;
  animateLegend: boolean;
  isUpdatingChart?: boolean;
  isDownsampled: boolean;
  onHoverItem: (item: BusterChartLegendItem, isHover: boolean) => void;
  onLegendItemClick: (item: BusterChartLegendItem) => void;
  onLegendItemFocus: ((item: BusterChartLegendItem) => void) | undefined;
};

export const BusterChartLegendWrapper: React.FC<BusterChartLegendWrapper> = React.memo(
  ({
    children,
    renderLegend,
    legendItems,
    showLegend,
    showLegendHeadline,
    inactiveDatasets,
    animateLegend,
    className,
    isUpdatingChart,
    isDownsampled,
    onHoverItem,
    onLegendItemClick,
    onLegendItemFocus
  }) => {
    const width = useChartWrapperContextSelector(({ width }) => width);

    return (
      <ChartLegendWrapperProvider inactiveDatasets={inactiveDatasets}>
        <div
          className={cn('legend-wrapper flex h-full w-full flex-col overflow-hidden', className)}>
          {renderLegend && (
            <BusterChartLegend
              show={showLegend}
              animateLegend={animateLegend}
              legendItems={legendItems}
              containerWidth={width}
              onClickItem={onLegendItemClick}
              onFocusItem={onLegendItemFocus}
              onHoverItem={onHoverItem}
              showLegendHeadline={showLegendHeadline}
            />
          )}

          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
            {isUpdatingChart && <LoadingOverlay />}
            {children}
            {isDownsampled && <DownsampleAlert isDownsampled={isDownsampled} />}
          </div>
        </div>
      </ChartLegendWrapperProvider>
    );
  }
);
BusterChartLegendWrapper.displayName = 'BusterChartLegendWrapper';

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-[1px] dark:from-gray-900/40 dark:to-gray-800/30">
      <CircleSpinnerLoader />
    </div>
  );
};
