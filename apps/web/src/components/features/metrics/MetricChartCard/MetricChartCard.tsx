import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import type { BusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useSelectedColorPalette } from '@/context/Themes/usePalettes';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { inputHasText } from '@/lib/text';
import { cn } from '@/lib/utils';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartProvider } from './MetricViewChartContext';
import { MetricViewChartHeader } from './MetricViewChartHeader';

export type MetricChartCardProps = {
  metricId: string;
  versionNumber: number | undefined;
  readOnly?: boolean;
  className?: string;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  headerSecondaryContent?: React.ReactNode;
  useHeaderLink?: boolean;
  animate?: boolean;
  renderChartContent?: boolean; // we do this to avoid expensive rendering if off screen
  disableTooltip?: boolean;
  cacheDataId?: string;
};

const stableMetricSelect = ({
  chart_config,
  name,
  description,
  time_frame,
  permission,
  version_number,
  versions,
}: BusterMetric) => ({
  name,
  description,
  time_frame,
  permission,
  chart_config,
  version_number,
  versions,
});
const stableMetricData: BusterMetricData['data'] = [];

export const MetricChartCard = React.memo(
  React.forwardRef<HTMLDivElement, MetricChartCardProps>(
    (
      {
        metricId,
        versionNumber,
        readOnly = false,
        className,
        useHeaderLink,
        headerSecondaryContent,
        attributes,
        listeners,
        animate = true,
        renderChartContent = true,
        disableTooltip,
        cacheDataId,
      },
      ref
    ) => {
      const { data: metric, isFetched: isFetchedMetric } = useGetMetric(
        { id: metricId, versionNumber },
        { select: stableMetricSelect, enabled: true }
      );
      const {
        data: metricData,
        isFetched: isFetchedMetricData,
        error: metricDataError,
      } = useGetMetricData({ id: metricId, versionNumber, cacheDataId });

      //data config
      const loadingData = !isFetchedMetricData;
      const hasData = !loadingData && !isEmpty(metricData?.data);
      const errorData = !!metricDataError;

      //metric config
      const { name, description, time_frame } = metric || {};
      const isTable = metric?.chart_config.selectedChartType === 'table';
      const colors = useSelectedColorPalette(metric?.chart_config.colors);
      const { onUpdateMetricName } = useUpdateMetricChart({ metricId });
      const onSetTitle = useMemoizedFn((title: string) => {
        if (inputHasText(title)) {
          onUpdateMetricName({ name: title });
        }
      });
      const memoizedChartConfig = useMemo(() => {
        return metric ? { ...metric.chart_config, colors } : undefined;
      }, [metric?.chart_config, colors]);

      return (
        <MetricViewChartCardContainer
          ref={ref}
          loadingData={loadingData}
          hasData={hasData}
          errorData={errorData}
          isTable={isTable}
          className={className}
        >
          <MetricViewChartHeader
            name={name}
            description={description}
            timeFrame={time_frame}
            onSetTitle={onSetTitle}
            readOnly={readOnly}
            headerSecondaryContent={headerSecondaryContent}
            useHeaderLink={useHeaderLink}
            attributes={attributes}
            listeners={listeners}
            metricId={metricId}
            metricVersionNumber={versionNumber}
          />
          <div className={'border-border border-b'} />
          {renderChartContent && (
            <MetricViewChartContent
              chartConfig={memoizedChartConfig}
              metricData={metricData?.data || stableMetricData}
              dataMetadata={metricData?.data_metadata}
              fetchedData={isFetchedMetricData}
              fetchedMetric={isFetchedMetric}
              errorMessage={metricDataError?.message}
              metricId={metricId}
              readOnly={readOnly}
              animate={animate}
              name={name || 'MetricViewChartContent'}
              disableTooltip={disableTooltip}
            />
          )}
        </MetricViewChartCardContainer>
      );
    }
  )
);

type MetricViewChartCardContainerProps = {
  children: React.ReactNode;
  loadingData: boolean;
  hasData: boolean;
  errorData: boolean;
  isTable: boolean;
  className?: string;
};

const MetricViewChartCardContainer = React.forwardRef<
  HTMLDivElement,
  MetricViewChartCardContainerProps
>(({ children, loadingData, hasData, errorData, isTable, className }, ref) => {
  const cardClass = React.useMemo(() => {
    if (loadingData || errorData || !hasData) return 'h-full max-h-[400px]';
    return 'h-full max-h-[400px]';
  }, [loadingData, hasData, errorData]);

  return (
    <MetricViewChartProvider>
      <div
        ref={ref}
        className={cn(
          'bg-background flex flex-col overflow-hidden rounded border shadow h-full',
          cardClass,
          className
        )}
      >
        {children}
      </div>
    </MetricViewChartProvider>
  );
});

MetricViewChartCardContainer.displayName = 'MetricViewChartCardContainer';
MetricChartCard.displayName = 'MetricChartCard';
