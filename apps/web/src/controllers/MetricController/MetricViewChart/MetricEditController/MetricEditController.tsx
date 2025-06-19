import React from 'react';
import { MetricEditControllerHeader } from './MetricEditControllerHeader';
import { MetricStylingApp } from './MetricStylingApp';

export const MetricEditController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  return (
    <div className="flex h-full w-full min-w-[250px] flex-col overflow-hidden">
      <MetricEditControllerHeader />
      <MetricStylingApp metricId={metricId} />
    </div>
  );
});

MetricEditController.displayName = 'MetricEditController';

export default MetricEditController;
