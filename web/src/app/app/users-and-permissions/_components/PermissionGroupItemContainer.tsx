import React from 'react';
import { AppMaterialIcons, ItemContainer, Text } from '@/components';
import { Button } from 'antd';
import { PermissionGroupRow } from './PermissionGroupRow';
import { BusterPermissionTeam } from '@/api/busterv2/permissions';
import { ContainerEmptyState } from './ContainerEmptyState';
import { useMemoizedFn } from 'ahooks';

export const PermissionGroupItemContainer: React.FC<{
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  onDelete: (d: { id: string; permission_groups: string[] }) => void;
  permissionGroups: BusterPermissionTeam['permission_groups'];
}> = ({ permissionGroups, setOpenModal, onDelete }) => {
  return (
    <ItemContainer
      className="mt-10 overflow-hidden"
      bodyClass="!p-0"
      title={
        <div className="flex w-full items-center justify-between">
          <Text type="secondary">Permission groups</Text>

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
      <div>
        {permissionGroups.map((group, index) => {
          return (
            <PermissionGroupRow
              key={group.id + index}
              group={group}
              index={index}
              onDelete={async () => {
                return onDelete({
                  id: group.id,
                  permission_groups: permissionGroups.map((g) => g.id).filter((g) => g !== group.id)
                });
              }}
            />
          );
        })}
      </div>

      {permissionGroups.length === 0 && (
        <ContainerEmptyState
          title="No assigned permission groups"
          description="This user has not been assigned any permission groups."
          buttonText="Assign a permission group"
          onClick={() => setOpenModal(true)}
        />
      )}
    </ItemContainer>
  );
};
