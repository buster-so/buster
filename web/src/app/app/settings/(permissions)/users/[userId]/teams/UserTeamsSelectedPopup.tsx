import { TeamRole, useUpdateUserTeams } from '@/api/buster_rest';
import { PermissionAssignTeamRoleButton } from '@/app/app/_components/PermissionComponents/PermissionAsssignTeamRoleButton';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import React from 'react';

export const UserTeamsSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  userId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, userId }) => {
  const { mutateAsync: updateUserTeams } = useUpdateUserTeams({
    userId: userId
  });

  const onRoleChange = useMemoizedFn(async (role: TeamRole) => {
    await updateUserTeams(
      selectedRowKeys.map((id) => ({
        id,
        role
      }))
    );
    onSelectChange([]);
  });

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[<PermissionAssignTeamRoleButton key="assign" onRoleChange={onRoleChange} />]}
    />
  );
});

UserTeamsSelectedPopup.displayName = 'UserTeamsSelectedPopup';
