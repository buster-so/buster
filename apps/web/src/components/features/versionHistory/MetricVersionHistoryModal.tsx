import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Button } from '../../ui/buttons';
import { CircleInfo } from '../../ui/icons';
import { MetricViewChart } from '../metrics/MetricViewChart';
import { createVersionHistoryItems } from './createVersionHelpers';
import { useVersionHistoryModalCommon } from './useVersionHistoryModalCommon';
import {
  type VersionHistoryItem,
  VersionHistoryModal,
  type VersionHistoryModalProps,
} from './VersionHistoryModal';

type MetricVersionHistoryModalProps = Pick<
  VersionHistoryModalProps,
  'onClose' | 'versionNumber'
> & {
  metricId: string;
  cacheId?: string;
};

export const MetricVersionHistoryModal = React.memo(
  ({
    onClose,
    versionNumber: versionNumberProp,
    metricId,
    cacheId,
  }: MetricVersionHistoryModalProps) => {
    const { data } = useGetMetric(
      { id: metricId, cacheId },
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
          <MetricViewChart
            metricId={metricId}
            versionNumber={versionNumber || undefined}
            readOnly
          />
        )}
      </VersionHistoryModal>
    );
  }
);
