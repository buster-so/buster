import { BusterPermissionGroup } from '@/api/busterv2/permissions';
import { AppMaterialIcons, ItemContainer, Text } from '@/components';
import { Button } from 'antd';
import React from 'react';
import { PermissionTeamRow } from './PermissionTeamRow';
import { ContainerEmptyState } from './ContainerEmptyState';

export const TeamItemContainer: React.FC<{
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  teams: BusterPermissionGroup['teams'];
  permissionGroupId?: string;
  userId?: string;
}> = ({ teams, setOpenModal, permissionGroupId, userId }) => {
  return (
    <ItemContainer
      className="mt-10 overflow-hidden"
      bodyClass="!p-0"
      title={
        <div className="flex w-full items-center justify-between">
          <Text type="secondary">Teams</Text>

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
      {teams.map((team, index) => {
        return (
          <PermissionTeamRow
            key={team.id}
            index={index}
            team={team}
            permissionGroupId={permissionGroupId}
            userId={userId}
          />
        );
      })}

      {teams.length === 0 && (
        <ContainerEmptyState
          title="No assigned teams"
          description="This has not been assigned any teams."
          buttonText="Assign a team"
          onClick={() => setOpenModal(true)}
        />
      )}
    </ItemContainer>
  );
};
