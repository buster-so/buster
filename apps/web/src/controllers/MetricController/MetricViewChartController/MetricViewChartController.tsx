import React from 'react';
import { MetricViewChart } from '@/components/features/metrics/MetricViewChart';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { MetricSaveFilePopup } from './MetricSaveFilePopup';

export const MetricViewChartController: React.FC<{
  metricId: string;
  versionNumber: number | undefined;
  readOnly?: boolean;
  className?: string;
  cardClassName?: string;
  animate?: boolean;
}> = React.memo(
  ({
    metricId,
    versionNumber,
    readOnly: readOnlyProp = false,
    animate = true,
    className = '',
    cardClassName = '',
  }) => {
    const { isReadOnly, isVersionHistoryMode, isViewingOldVersion } = useIsMetricReadOnly({
      metricId,
      readOnly: readOnlyProp,
    });

    return (
      <>
        <MetricViewChart
          metricId={metricId}
          versionNumber={versionNumber}
          readOnly={isReadOnly}
          className={className}
          cardClassName={cardClassName}
          animate={animate}
        />
        {!isReadOnly && !isVersionHistoryMode && !isViewingOldVersion && (
          <MetricSaveFilePopup metricId={metricId} />
        )}
      </>
    );
  }
);
