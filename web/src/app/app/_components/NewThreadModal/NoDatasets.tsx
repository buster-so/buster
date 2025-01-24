import React from 'react';
import { Button } from 'antd';
import { Text, Title } from '@/components/text';
import { AppMaterialIcons } from '@/components/icons';

export const NoDatasets: React.FC<{
  onClose: () => void;
  setOpenNewDatasetModal: (open: boolean) => void;
}> = React.memo(({ onClose, setOpenNewDatasetModal }) => {
  return (
    <>
      <div className="flex flex-col items-center space-y-3 p-3">
        <div className="mt-0 flex w-full flex-col justify-center space-y-3 rounded p-4">
          <Title level={4}>{`You don't have any datasets yet.`}</Title>
          <Text>In order to get started, create a dataset.</Text>

          <Button
            onClick={() => {
              setOpenNewDatasetModal(true);
              onClose();
            }}
            type="default"
            icon={<AppMaterialIcons icon="table_view" />}>
            Create dataset
          </Button>
        </div>
      </div>
    </>
  );
});
NoDatasets.displayName = 'NoDatasets';
