import React from 'react';
import { TooltipTitle } from './TooltipTitle';
import type { ITooltipItem } from './interfaces';
import { TooltipItem } from './TooltipItem';

const MAX_ITEMS_IN_TOOLTIP = 12;

export const BusterChartTooltip: React.FC<{
  tooltipItems: ITooltipItem[];
  title: string | { title: string; color: string | undefined; seriesType: string } | undefined;
}> = ({ tooltipItems, title }) => {
  const shownItems = tooltipItems.slice(0, MAX_ITEMS_IN_TOOLTIP);
  const hiddenItems = tooltipItems.slice(MAX_ITEMS_IN_TOOLTIP);
  const hasHiddenItems = hiddenItems.length > 0;
  const isScatter = tooltipItems[0]?.seriesType === 'scatter';

  return (
    <div
      className={`flex max-h-[500px] max-w-[300px] min-w-24 flex-col overflow-hidden ${
        tooltipItems.length === 0 ? 'hidden!' : ''
      }`}>
      {title && <TooltipTitle title={title} />}

      <div className="flex flex-col py-1.5">
        <div
          className={`grid ${
            isScatter
              ? 'grid-cols-1 gap-y-[3px]'
              : 'grid-cols-[auto_auto] items-center gap-x-5 gap-y-[3px]'
          }`}>
          {shownItems.map((param, index) => (
            <TooltipItem key={index} {...param} />
          ))}
        </div>

        {hasHiddenItems && (
          <div className="text-text-secondary mt-1 pl-3 text-sm">{`${hiddenItems.length} more...`}</div>
        )}
      </div>
    </div>
  );
};
