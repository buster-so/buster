import { useMemo } from 'react';
import { barDelayAnimation } from '../../core/animations/barDelayAnimation';
import { ANIMATION_DURATION, ANIMATION_THRESHOLD } from '../../../config';
import { AnimationOptions, ChartType as ChartTypeJS } from 'chart.js';
import { BusterChartProps, ChartType } from '@/api/asset_interfaces/metric';

export const useAnimations = ({
  animate,
  numberOfSources,
  chartType,
  barGroupType
}: {
  animate: boolean;
  numberOfSources: number;
  chartType: ChartType;
  barGroupType: BusterChartProps['barGroupType'];
}): AnimationOptions<ChartTypeJS>['animation'] => {
  const isAnimationEnabled = useMemo(() => {
    return animate && numberOfSources <= ANIMATION_THRESHOLD;
  }, [animate, numberOfSources]);

  return useMemo(() => {
    return isAnimationEnabled
      ? {
          duration: ANIMATION_DURATION,
          ...animationRecord[chartType]?.({ barGroupType })
        }
      : false;
  }, [isAnimationEnabled, chartType]);
};

const animationRecord: Record<
  ChartType,
  ({
    barGroupType
  }: {
    barGroupType: BusterChartProps['barGroupType'];
  }) => AnimationOptions<ChartTypeJS>['animation']
> = {
  bar: barDelayAnimation,
  line: () => ({}),
  scatter: () => ({}),
  pie: () => ({}),
  metric: () => ({}),
  table: () => ({}),
  combo: () => ({})
};
