import { AppMaterialIcons, ItemContainer, Text } from '@/components';
import { Button } from 'antd';
import React from 'react';
import { PermissionUserRow } from './PermissionUserRow';
import { BusterPermissionTeam } from '@/api/busterv2/permissions';
import { ContainerEmptyState } from './ContainerEmptyState';

export const UserItemContainer: React.FC<{
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  users: BusterPermissionTeam['users'];
  teamId: string;
  allUsers: BusterPermissionTeam['users'];
}> = ({ teamId, allUsers, users, setOpenModal }) => {
  return (
    <ItemContainer
      className="mt-10 overflow-hidden"
      bodyClass="!p-0"
      title={
        <div className="flex w-full items-center justify-between">
          <Text type="secondary">Users</Text>

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
      {users.map((user, index) => {
        return (
          <PermissionUserRow
            key={user.id}
            index={index}
            user={user}
            teamId={teamId}
            allUsers={allUsers}></PermissionUserRow>
        );
      })}

      {users.length === 0 && (
        <ContainerEmptyState
          title="No assigned users"
          description="This has not been assigned any users."
          buttonText="Assign a user"
          onClick={() => setOpenModal(true)}></ContainerEmptyState>
      )}
    </ItemContainer>
  );
};
