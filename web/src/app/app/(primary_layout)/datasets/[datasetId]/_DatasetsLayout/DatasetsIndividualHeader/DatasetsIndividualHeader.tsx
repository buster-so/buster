'use client';

import { Button } from '@/components/ui/buttons';
import { PreventNavigation } from '@/components/ui/layouts/PreventNavigation';
import { Separator } from '@/components/ui/seperator';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { useDatasetPageContextSelector } from '../DatasetPageContext';
import { DatasetBreadcrumb } from './DatasetBreadcrumb';
import { DatasetsHeaderOptions } from './DatasetHeaderOptions';
import { DatasetIndividualThreeDotMenu } from './DatasetIndividualThreeDotMenu';

export const DatasetsIndividualHeader: React.FC = React.memo(() => {
  const selectedApp = useDatasetPageContextSelector((state) => state.selectedApp);
  const dataset = useDatasetPageContextSelector((state) => state.dataset);
  const onPublishDataset = useDatasetPageContextSelector((state) => state.onPublishDataset);
  const isDeployingDataset = useDatasetPageContextSelector((state) => state.isDeployingDataset);
  const resetDataset = useDatasetPageContextSelector((state) => state.resetDataset);
  const disablePublish = useDatasetPageContextSelector((state) => state.disablePublish);
  const isChangedSQL = useDatasetPageContextSelector((state) => state.isChangedSQL);
  const datasetId = useDatasetPageContextSelector((state) => state.datasetId);

  const datasetName = dataset?.data?.name;

  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const preventNavigation = !disablePublish;

  const onReset = useMemoizedFn(() => {
    resetDataset();
  });

  const onCancelPreventNavigation = useMemoizedFn(async () => {
    setTimeout(() => {
      onReset();
    }, 300);
  });

  return (
    <>
      <>
        <div className="flex items-center space-x-3 overflow-hidden">
          <DatasetBreadcrumb datasetName={datasetName} />

          <DatasetsHeaderOptions
            isAdmin={isAdmin}
            selectedApp={selectedApp}
            datasetId={datasetId}
          />
        </div>

        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <DatasetIndividualThreeDotMenu datasetId={datasetId} />

            <Separator orientation="vertical" className="h-4!" />

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={onReset}
                disabled={!isChangedSQL || isDeployingDataset}>
                Reset
              </Button>
              <Button
                variant="primary"
                disabled={disablePublish}
                onClick={onPublishDataset}
                loading={isDeployingDataset}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      </>

      <PreventNavigation
        isDirty={preventNavigation}
        title="Would you like to publish your changes to this dataset?"
        description="You are about to leave this page without publishing changes. Would you like to publish your changes before you leave?"
        okText="Publish changes"
        cancelText="Discard changes"
        onOk={onPublishDataset}
        onCancel={onCancelPreventNavigation}
      />
    </>
  );
});

DatasetsIndividualHeader.displayName = 'DatasetsIndividualHeader';
