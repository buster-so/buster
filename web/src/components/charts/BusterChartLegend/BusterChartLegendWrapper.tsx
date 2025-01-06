import { createStyles } from 'antd-style';
import React, { useRef } from 'react';
import { BusterChartLegend, BusterChartLegendItem } from '.';
import { useSize } from 'ahooks';
import { ShowLegendHeadline } from '../interfaces';
import { ChartWrapperProvider } from '../chartHooks/useChartWrapperProvider';

export type BusterChartLegendWrapper = {
  children: React.ReactNode;
  renderLegend: boolean;
  legendItems: BusterChartLegendItem[];
  showLegend: boolean;
  showLegendHeadline: ShowLegendHeadline | undefined;
  inactiveDatasets: Record<string, boolean>;
  className: string | undefined;
  animate: boolean;
  onHoverItem: (item: BusterChartLegendItem, isHover: boolean) => void;
  onLegendItemClick: (item: BusterChartLegendItem) => void;
  onLegendItemFocus: ((item: BusterChartLegendItem) => void) | undefined;
}; //TODO scope down to only the props that are needed for this component

export const BusterChartLegendWrapper: React.FC<BusterChartLegendWrapper> = React.memo(
  ({
    children,
    renderLegend,
    legendItems,
    showLegend,
    showLegendHeadline,
    inactiveDatasets,
    animate,
    className,
    onHoverItem,
    onLegendItemClick,
    onLegendItemFocus
  }) => {
    const { cx } = useStyles();
    const ref = useRef<HTMLDivElement>(null);
    const size = useSize(ref);
    const width = size?.width ?? 400;

    return (
      <ChartWrapperProvider width={width} inactiveDatasets={inactiveDatasets}>
        <div ref={ref} className={cx(className, 'flex h-full w-full flex-col overflow-hidden')}>
          {renderLegend && (
            <BusterChartLegend
              show={showLegend}
              animate={animate}
              legendItems={legendItems}
              containerWidth={width}
              onClickItem={onLegendItemClick}
              onFocusItem={onLegendItemFocus}
              onHoverItem={onHoverItem}
              showLegendHeadline={showLegendHeadline}
            />
          )}

          <div className="h-full w-full overflow-hidden">{children}</div>
        </div>
      </ChartWrapperProvider>
    );
  }
);
BusterChartLegendWrapper.displayName = 'BusterChartLegendWrapper';

const useStyles = createStyles(({ token }) => {
  return {};
});