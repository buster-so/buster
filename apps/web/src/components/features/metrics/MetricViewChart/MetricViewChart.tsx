import React from 'react';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetricData } from '@/api/buster_rest/metrics';
import { cn } from '@/lib/utils';
import { MetricChartCard } from '../MetricChartCard';
import { MetricDataTruncatedWarning } from './MetricDataTruncatedWarning';

const stableMetricDataSelect = (x: BusterMetricData) => x?.has_more_records;

export const MetricViewChart: React.FC<{
  metricId: string;
  versionNumber: number | undefined;
  readOnly?: boolean;
  className?: string;
  cardClassName?: string;
}> = React.memo(
  ({ metricId, versionNumber, readOnly = false, className = '', cardClassName = '' }) => {
    const { data: hasMoreRecords } = useGetMetricData(
      { id: metricId, versionNumber },
      { select: stableMetricDataSelect }
    );

    return (
      <div className={cn('flex h-full flex-col justify-between space-y-3.5 p-5', className)}>
        <div className="flex h-full flex-col space-y-3">
          <MetricChartCard
            metricId={metricId}
            versionNumber={versionNumber}
            readOnly={readOnly}
            className={cardClassName}
          />
          {hasMoreRecords && (
            <MetricDataTruncatedWarning metricId={metricId} metricVersionNumber={versionNumber} />
          )}
        </div>
      </div>
    );
  }
);

MetricViewChart.displayName = 'MetricViewChart';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};
