import React from 'react';
import { SaveResetFilePopup } from '@/components/features/popups/SaveResetFilePopup';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';

export const MetricSaveFilePopup: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const onResetToOriginal = useChatIndividualContextSelector((x) => x.onResetToOriginal);
  const isFileChanged = useChatIndividualContextSelector((x) => x.isFileChanged);
  const { onSaveMetricToServer, isSaving } = useUpdateMetricChart({ metricId });

  return (
    <SaveResetFilePopup
      open={isFileChanged}
      onReset={onResetToOriginal}
      onSave={onSaveMetricToServer}
      isSaving={isSaving}
      showHotsKeys={false}
    />
  );
});

MetricSaveFilePopup.displayName = 'MetricSaveFilePopup';
