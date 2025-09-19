import React, { useCallback } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useUpdateMetric } from '@/api/buster_rest/metrics';
import { EditFileContainer } from '@/components/features/files/EditFileContainer';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const MetricViewFile: React.FC<{ metricId: string; cacheId?: string }> = React.memo(
  ({ metricId, cacheId }) => {
    const { data: metric } = useGetMetric(
      { id: metricId, cacheId },
      {
        select: useCallback(
          ({ file, file_name }: BusterMetric) => ({
            file,
            file_name,
          }),
          []
        ),
      }
    );
    const { openSuccessMessage } = useBusterNotifications();
    const {
      mutateAsync: updateMetric,
      isPending: isUpdatingMetric,
      error: updateMetricError,
    } = useUpdateMetric({
      updateOnSave: true,
      saveToServer: true,
      updateVersion: false,
    });

    const { isReadOnly } = useIsMetricReadOnly({
      metricId,
    });

    const updateMetricErrorMessage = updateMetricError?.message;

    const { file, file_name } = metric || {};

    const onSaveFile = useMemoizedFn(async (file: string) => {
      await updateMetric({
        file,
        id: metricId,
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
  }
);

MetricViewFile.displayName = 'MetricViewFile';
