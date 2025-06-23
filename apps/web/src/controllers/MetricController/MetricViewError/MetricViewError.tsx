import type React from 'react';
import { StatusCard } from '@/components/ui/card/StatusCard';

export const MetricViewError: React.FC<{ error: string | undefined }> = ({
  error = 'The metric you are trying to view has an error. Please contact support if the problem persists.'
}) => {
  return (
    <div className="mx-6 mt-6">
      <StatusCard message={error} title="Metric Error" />
    </div>
  );
};
