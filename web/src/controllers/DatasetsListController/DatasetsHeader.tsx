'use client';

import React, { useMemo } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { BusterRoutes } from '@/routes';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { AppTooltip } from '@/components/ui/tooltip';
import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';
import { useIndividualDataset } from '@/api/buster_rest';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { Plus } from '@/components/ui/icons';

export const DatasetHeader: React.FC<{
  datasetFilter: 'all' | 'published' | 'drafts';
  setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
  datasetId?: string;
  setOpenNewDatasetModal: (open: boolean) => void;
  openNewDatasetModal: boolean;
}> = React.memo(
  ({ datasetFilter, setDatasetFilter, datasetId, setOpenNewDatasetModal, openNewDatasetModal }) => {
    const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
    const { dataset } = useIndividualDataset({ datasetId });
    const datasetTitle = dataset?.data?.name || 'Datasets';

    const breadcrumbItems: BreadcrumbItem[] = useMemo(
      () => [
        {
          label: datasetTitle,
          route: datasetId
            ? {
                route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
                datasetId: datasetId
              }
            : { route: BusterRoutes.APP_DATASETS }
        }
      ],
      [datasetId, datasetTitle]
    );

    const onCloseNewDatasetModal = useMemoizedFn(() => {
      setOpenNewDatasetModal(false);
    });

    const onOpenNewDatasetModal = useMemoizedFn(() => {
      setOpenNewDatasetModal(true);
    });

    useHotkeys('d', onOpenNewDatasetModal);

    return (
      <>
        <div className="flex space-x-3">
          <Breadcrumb items={breadcrumbItems} />
          {/* <DatasetFilters datasetFilter={datasetFilter} setDatasetFilter={setDatasetFilter} /> */}
        </div>

        {/* <div className="flex items-center">
          {isAdmin && (
            <AppTooltip title={'Create new dashboard'} shortcuts={['D']}>
              <Button prefix={<Plus />} onClick={onOpenNewDatasetModal}>
                New Dataset
              </Button>
            </AppTooltip>
          )}
        </div>

        {isAdmin && <NewDatasetModal open={openNewDatasetModal} onClose={onCloseNewDatasetModal} />} */}
      </>
    );
  }
);
DatasetHeader.displayName = 'DatasetHeader';

const DatasetFilters: React.FC<{
  datasetFilter: 'all' | 'published' | 'drafts';
  setDatasetFilter: (filter: 'all' | 'published' | 'drafts') => void;
}> = ({ datasetFilter, setDatasetFilter }) => {
  const options: SegmentedItem<'all' | 'published' | 'drafts'>[] = useMemo(
    () => [
      { label: 'All', value: 'all' },
      { label: 'Published', value: 'published' },
      { label: 'Drafts', value: 'drafts' }
    ],
    []
  );

  return (
    <AppSegmented
      options={options}
      value={datasetFilter}
      type="button"
      onChange={(value) => {
        setDatasetFilter(value.value);
      }}
    />
  );
};
