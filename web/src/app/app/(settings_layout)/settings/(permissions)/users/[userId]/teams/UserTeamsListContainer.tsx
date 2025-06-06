'use client';

import pluralize from 'pluralize';
import React, { useMemo, useState } from 'react';
import type { BusterUserTeamListItem, TeamRole } from '@/api/asset_interfaces';
import { useUpdateUserTeams } from '@/api/buster_rest';
import { PermissionAssignTeamRole } from '@/components/features/PermissionComponents';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { UserTeamsSelectedPopup } from './UserTeamsSelectedPopup';

export const UserTeamsListContainer: React.FC<{
  filteredTeams: BusterUserTeamListItem[];
  userId: string;
}> = React.memo(({ filteredTeams, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserTeams } = useUpdateUserTeams({
    userId: userId
  });

  const onRoleChange = useMemoizedFn(async (params: { id: string; role: TeamRole }) => {
    await updateUserTeams([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      },
      {
        title: 'Role',
        dataIndex: 'assigned',
        width: 285,
        render: (assigned: boolean, permissionGroup: BusterUserTeamListItem) => {
          const { user_count, id, role } = permissionGroup;
          return (
            <div className="flex justify-end">
              <PermissionAssignTeamRole role={role} id={id} onRoleChange={onRoleChange}>
                <Text variant="secondary">{`${user_count} ${pluralize('users', user_count)}`}</Text>
              </PermissionAssignTeamRole>
            </div>
          );
        }
      }
    ],
    []
  );

  const { managerTeams, memberTeams, notAMemberTeams } = useMemo(() => {
    const result: {
      managerTeams: BusterListRowItem[];
      memberTeams: BusterListRowItem[];
      notAMemberTeams: BusterListRowItem[];
    } = filteredTeams.reduce<{
      managerTeams: BusterListRowItem[];
      memberTeams: BusterListRowItem[];
      notAMemberTeams: BusterListRowItem[];
    }>(
      (acc, team) => {
        const teamItem: BusterListRowItem = {
          id: team.id,
          data: team,
          link: createBusterRoute({
            route: BusterRoutes.SETTINGS_USERS_ID,
            userId: team.id
          })
        };
        if (team.role === 'manager') {
          acc.managerTeams.push(teamItem);
        } else if (team.role === 'member') {
          acc.memberTeams.push(teamItem);
        } else {
          acc.notAMemberTeams.push(teamItem);
        }
        return acc;
      },
      {
        managerTeams: [] as BusterListRowItem[],
        memberTeams: [] as BusterListRowItem[],
        notAMemberTeams: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredTeams]);

  const rows = useMemo(
    () => [
      {
        id: 'header-manager',
        data: {},
        hidden: managerTeams.length === 0,
        rowSection: {
          title: 'Manager',
          secondaryTitle: managerTeams.length.toString()
        }
      },
      ...managerTeams,
      {
        id: 'header-member',
        data: {},
        hidden: memberTeams.length === 0,
        rowSection: {
          title: 'Member',
          secondaryTitle: memberTeams.length.toString()
        }
      },
      ...memberTeams,
      {
        id: 'header-not-assigned',
        data: {},
        hidden: notAMemberTeams.length === 0,
        rowSection: {
          title: 'Not a member',
          secondaryTitle: notAMemberTeams.length.toString()
        }
      },
      ...notAMemberTeams
    ],
    [managerTeams, memberTeams, notAMemberTeams]
  );

  const emptyStateComponent = useMemo(() => <EmptyStateList text="No teams found" />, []);

  return (
    <InfiniteListContainer
      popupNode={
        <UserTeamsSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          userId={userId}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
});

UserTeamsListContainer.displayName = 'UserTeamsListContainer';
