'use client';

import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo } from 'react';
import { DataSetAppText, DatasetApps } from '../config';

export const DatasetsHeaderOptions: React.FC<{
  selectedApp: DatasetApps;
  isAdmin: boolean;
  datasetId: string | undefined;
}> = React.memo(({ datasetId, isAdmin, selectedApp }) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const optionsItems = useMemo(
    () =>
      isAdmin
        ? [DatasetApps.OVERVIEW, DatasetApps.PERMISSIONS, DatasetApps.EDITOR]
        : [DatasetApps.OVERVIEW, DatasetApps.PERMISSIONS],
    [isAdmin]
  );

  const options: SegmentedItem<DatasetApps>[] = useMemo(
    () =>
      optionsItems.map((key) => ({
        label: DataSetAppText[key as DatasetApps],
        link: datasetId ? keyToRoute(datasetId, key) : '',
        value: key
      })),
    [datasetId, optionsItems]
  );

  const onChangeSegment = useMemoizedFn((value: SegmentedItem<DatasetApps>) => {
    if (datasetId) onChangePage(keyToRoute(datasetId, value.value));
  });

  return (
    <AppSegmented type="button" options={options} value={selectedApp} onChange={onChangeSegment} />
  );
});
DatasetsHeaderOptions.displayName = 'DatasetsHeaderOptions';

const keyToRoute = (datasetId: string, key: DatasetApps) => {
  const record: Record<DatasetApps, string> = {
    [DatasetApps.PERMISSIONS]: createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW,
      datasetId
    }),
    [DatasetApps.OVERVIEW]: createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
      datasetId
    }),
    [DatasetApps.EDITOR]: createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_EDITOR,
      datasetId
    })
  };

  return record[key];
};
