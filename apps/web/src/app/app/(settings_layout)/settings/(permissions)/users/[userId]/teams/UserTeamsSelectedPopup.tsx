import React from 'react';
import type { TeamRole } from '@/api/asset_interfaces';
import { useUpdateUserTeams } from '@/api/buster_rest';
import { PermissionAssignTeamRoleButton } from '@/components/features/PermissionComponents';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useMemoizedFn } from '@/hooks';

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
