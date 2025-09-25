import React from 'react';
import { MetricStylingApp } from './MetricStylingApp';

export const MetricEditController: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
}> = React.memo(({ metricId, metricVersionNumber }) => {
  return (
    <div className="flex h-full w-full min-w-[260px] flex-col overflow-hidden">
      <MetricStylingApp metricId={metricId} metricVersionNumber={metricVersionNumber} />
    </div>
  );
});

MetricEditController.displayName = 'MetricEditController';

export default MetricEditController;
