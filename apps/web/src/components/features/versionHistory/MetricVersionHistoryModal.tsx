import React, { useCallback } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { MetricViewChart } from '../metrics/MetricViewChart';
import { useVersionHistoryModalCommon } from './useVersionHistoryModalCommon';
import { VersionHistoryModal, type VersionHistoryModalProps } from './VersionHistoryModal';

type MetricVersionHistoryModalProps = Pick<
  VersionHistoryModalProps,
  'onClose' | 'versionNumber'
> & {
  metricId: string;
};

export const MetricVersionHistoryModal = React.memo(
  ({ onClose, versionNumber: versionNumberProp, metricId }: MetricVersionHistoryModalProps) => {
    const { data } = useGetMetric(
      { id: metricId, versionNumber: 'LATEST' },
      {
        select: useCallback(
          (x: BusterMetric) => ({
            versions: x.versions,
            name: x.name,
          }),
          []
        ),
      }
    );
    const { mutateAsync: updateMetric, isPending: isRestoringVersion } = useSaveMetric({
      updateOnSave: true,
    });

    const {
      title,
      versionNumber,
      versionHistoryItems,
      onClickVersion,
      onClickRestoreVersion,
      learnMoreButton,
    } = useVersionHistoryModalCommon({
      versionNumber: versionNumberProp,
      versions: data?.versions,
      title: data?.name,
      isRestoringVersion,
      onClose,
      updateAsset: async (versionNumber: number) => {
        await updateMetric({
          id: metricId,
          restore_to_version: versionNumber,
        });
      },
    });

    return (
      <VersionHistoryModal
        onClose={onClose}
        versionNumber={versionNumber}
        title={title}
        versionHistoryItems={versionHistoryItems}
        onClickVersion={onClickVersion}
        onClickRestoreVersion={onClickRestoreVersion}
        isRestoringVersion={isRestoringVersion}
        learnMoreButton={learnMoreButton}
      >
        {versionNumber && (
          <MetricViewChart metricId={metricId} versionNumber={versionNumber} readOnly />
        )}
      </VersionHistoryModal>
    );
  }
);
