import React, { useRef } from 'react';
import { MetricChartCard } from '@/components/features/metrics/MetricChartCard';
import { ReportMetricThreeDotMenu } from '@/components/features/metrics/ReportMetricItem';
import { useGetReportParams } from '@/context/Reports/useGetReportParams';
import { useInViewport } from '@/hooks/useInViewport';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const MetricContent = React.memo(
  ({
    metricId,
    metricVersionNumber,
    isExportMode = false,
    readOnly = false,
    className,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    readOnly?: boolean;
    isExportMode?: boolean;
    className?: string;
  }) => {
    const { reportId = '' } = useGetReportParams();
    const ref = useRef<HTMLDivElement>(null);
    const hasBeenInViewport = useRef(false);

    const [inViewport] = useInViewport(ref, {
      threshold: 0.275,
    });
    if (inViewport && !hasBeenInViewport.current) {
      hasBeenInViewport.current = true;
    }
    const renderChart = inViewport || isExportMode || hasBeenInViewport.current;

    const handleCopy = useMemoizedFn((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
    });

    return (
      <MetricChartCard
        ref={ref}
        metricId={metricId}
        useHeaderLink={!readOnly}
        versionNumber={metricVersionNumber}
        readOnly
        renderChartContent={renderChart}
        animate={!isExportMode}
        className={className}
        cacheDataId={reportId}
        headerSecondaryContent={
          !readOnly && (
            <ReportMetricThreeDotMenu
              metricId={metricId}
              metricVersionNumber={metricVersionNumber}
              reportId={reportId}
            />
          )
        }
        onCopy={handleCopy}
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
