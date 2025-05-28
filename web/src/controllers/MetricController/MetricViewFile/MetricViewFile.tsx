'use client';

import { useGetMetric, useUpdateMetric } from '@/api/buster_rest/metrics';
import { EditFileContainer } from '@/components/features/files/EditFileContainer';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

export const MetricViewFile: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { data: metric } = useGetMetric(
    { id: metricId },
    {
      select: ({ file, file_name }) => ({
        file,
        file_name
      })
    }
  );
  const { openSuccessMessage } = useBusterNotifications();
  const {
    mutateAsync: updateMetric,
    isPending: isUpdatingMetric,
    error: updateMetricError
  } = useUpdateMetric({
    updateOnSave: true,
    saveToServer: true,
    updateVersion: false
  });

  const { isReadOnly } = useIsMetricReadOnly({
    metricId
  });

  const updateMetricErrorMessage = updateMetricError?.message;

  const { file, file_name } = metric || {};

  const onSaveFile = useMemoizedFn(async (file: string) => {
    await updateMetric({
      file,
      id: metricId
    });
    openSuccessMessage(`${file_name} saved`);
  });

  return (
    <EditFileContainer
      fileName={file_name}
      file={file}
      onSaveFile={onSaveFile}
      error={updateMetricErrorMessage}
      isSaving={isUpdatingMetric}
      readOnly={isReadOnly}
    />
  );
});

MetricViewFile.displayName = 'MetricViewFile';
