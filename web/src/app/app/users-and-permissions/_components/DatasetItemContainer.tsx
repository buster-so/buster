import { BusterDatasetListItem } from '@/api/busterv2/datasets';
import { AppMaterialIcons, ItemContainer, Text } from '@/components';
import { Button } from 'antd';
import React from 'react';
import { PermissionDatasetRow } from '../permission-groups/[permissionGroupId]/_PermissionDataRow';
import { ContainerEmptyState } from './ContainerEmptyState';

export const DatasetItemContainer: React.FC<{
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  datasets: BusterDatasetListItem[];
}> = ({ datasets, setOpenModal }) => {
  return (
    <ItemContainer
      className="mt-10 overflow-hidden"
      bodyClass="!p-0"
      title={
        <div className="flex w-full items-center justify-between">
          <Text type="secondary">Datasets</Text>

          <div className="flex items-center space-x-2">
            <Button
              type="text"
              onClick={() => {
                setOpenModal(true);
              }}
              icon={<AppMaterialIcons size={16} icon="edit_square" />}></Button>
          </div>
        </div>
      }>
      {datasets.map((ds, index) => {
        return <PermissionDatasetRow key={ds.id} index={index} dataset={ds} />;
      })}

      {datasets.length === 0 && (
        <ContainerEmptyState
          title="No assigned datasets"
          description="This has not been assigned any datasets."
          buttonText="Assign a dataset"
          onClick={() => setOpenModal(true)}></ContainerEmptyState>
      )}
    </ItemContainer>
  );
};
