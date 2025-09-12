import './ChartJSTheme';

import {
  DEFAULT_CHART_CONFIG,
  DEFAULT_CHART_THEME,
  DEFAULT_COLUMN_METADATA,
} from '@buster/server-shared/metrics';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterChartComponentProps } from '../interfaces';
import { BusterChartJSComponent } from './BusterChartJSComponent';
import { BusterChartJSLegendWrapper } from './BusterChartJSLegendWrapper';
import { useSetupChartJS } from './ChartJsContextStore';
import type { ChartJSOrUndefined } from './core/types';

export const BusterChartJS: React.FC<BusterChartComponentProps> = ({
  selectedChartType,
  className = '',
  animate = true,
  colors = DEFAULT_CHART_THEME,
  showLegend,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  selectedAxis,
  loading = false,
  showLegendHeadline,
  columnMetadata = DEFAULT_COLUMN_METADATA,
  onChartMounted,
  onInitialAnimationEnd,
  columnSettings = DEFAULT_CHART_CONFIG.columnSettings,
  animateLegend,
  ...props
}) => {
  const chartRef = useRef<ChartJSOrUndefined>(null);
  const [chartMounted, setChartMounted] = useState(false);

  const { lineGroupType, pieMinimumSlicePercentage, barGroupType, datasetOptions } = props;

  const onChartReady = useMemoizedFn(() => {
    setChartMounted(true);
    if (chartRef.current) onChartMounted?.(chartRef.current);
  });

  const onInitialAnimationEndPreflight = useCallback(() => {
    if (chartRef.current?.attached) onInitialAnimationEnd?.();
  }, [onInitialAnimationEnd]);

  const hasSetupChartJS = useSetupChartJS();

  if (!hasSetupChartJS) return null;

  return (
    <BusterChartJSLegendWrapper
      animateLegend={animateLegend}
      loading={loading}
      columnLabelFormats={columnLabelFormats}
      selectedAxis={selectedAxis}
      chartMounted={chartMounted}
      showLegend={showLegend}
      showLegendHeadline={showLegendHeadline}
      className={className}
      selectedChartType={selectedChartType}
      columnSettings={columnSettings}
      columnMetadata={columnMetadata}
      lineGroupType={lineGroupType}
      barGroupType={barGroupType}
      colors={colors}
      chartRef={chartRef}
      datasetOptions={datasetOptions}
      isDownsampled={props.isDownsampled}
      numberOfDataPoints={props.numberOfDataPoints}
      pieMinimumSlicePercentage={pieMinimumSlicePercentage}
    >
      <BusterChartJSComponent
        ref={chartRef}
        selectedChartType={selectedChartType}
        onChartReady={onChartReady}
        onInitialAnimationEnd={onInitialAnimationEndPreflight}
        selectedAxis={selectedAxis}
        columnLabelFormats={columnLabelFormats}
        colors={colors}
        columnMetadata={columnMetadata}
        animate={animate}
        columnSettings={columnSettings}
        {...props}
        className={className}
      />
    </BusterChartJSLegendWrapper>
  );
};

BusterChartJS.displayName = 'BusterChartJS';
