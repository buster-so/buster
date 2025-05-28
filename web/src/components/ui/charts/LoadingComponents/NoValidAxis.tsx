import type React from 'react';
import { useMemo } from 'react';
import { useMount } from '@/hooks';
import type { BusterChartProps, ChartType } from '@/api/asset_interfaces/metric/charts';

export const NoValidAxis: React.FC<{
  type: ChartType;
  onReady?: () => void;
  data: BusterChartProps['data'];
}> = ({ onReady, type, data }) => {
  const inValidChartText = useMemo(() => {
    if (!type) return 'No valid chart type';
    return 'No valid axis selected';
  }, [type, data]);

  useMount(() => {
    onReady?.();
  });

  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-text-tertiary">{inValidChartText}</span>
    </div>
  );
};
