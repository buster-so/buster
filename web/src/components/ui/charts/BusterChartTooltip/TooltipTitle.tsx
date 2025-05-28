import type React from 'react';
import { LegendItemDot } from '../BusterChartLegend';
import type { ChartType } from '@/api/asset_interfaces/metric';

export const TooltipTitle: React.FC<{
  title: string | { title: string; color: string | undefined; seriesType: string } | undefined;
}> = ({ title: titleProp }) => {
  if (!titleProp) return null;

  const isTitleString = typeof titleProp === 'string';
  const title = isTitleString ? titleProp : titleProp.title;
  const color = isTitleString ? undefined : titleProp.color;
  const seriesType = isTitleString ? undefined : titleProp.seriesType;

  return (
    <div className={'flex items-center space-x-1.5 border-b px-3 py-1.5'}>
      {seriesType && (
        <LegendItemDot color={color} type={seriesType as ChartType} inactive={false} />
      )}
      <span className="text-foreground text-base font-medium">{title}</span>
    </div>
  );
};
