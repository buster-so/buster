import {
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse,
  useDatasetUpdatePermissionUsers
} from '@/api/buster-rest/datasets';
import { BusterUserAvatar } from '@/components';
import { BusterListColumn, BusterListRowItem } from '@/components/list';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList';
import { useMemoizedFn } from 'ahooks';
import { Select } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';

export const PermissionListUsersContainer: React.FC<{
  filteredPermissionUsers: ListPermissionUsersResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionUsers, datasetId }) => {
  const { styles, cx } = useStyles();
  const { mutateAsync: updatePermissionUsers } = useDatasetUpdatePermissionUsers(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionUsers = filteredPermissionUsers.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionUsers([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270,
        render: (name: string, user: ListPermissionUsersResponse) => {
          return <PermissionGroupInfoCell name={name} email={user.email} />;
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, permissionGroup: ListPermissionGroupsResponse) => {
          return (
            <div className="flex justify-end">
              <PermissionGroupAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                onSelect={onSelectAssigned}
              />
            </div>
          );
        }
      }
    ],
    []
  );

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    } = filteredPermissionUsers.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, permissionUser) => {
        if (permissionUser.assigned) {
          acc.canQueryPermissionUsers.push({
            id: permissionUser.id,
            data: permissionUser
          });
        } else {
          acc.cannotQueryPermissionUsers.push({
            id: permissionUser.id,
            data: permissionUser
          });
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredPermissionUsers]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionUsers.length.toString()
          }
        },
        ...canQueryPermissionUsers,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionUsers.length.toString()
          }
        },
        ...cannotQueryPermissionUsers
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfPermissionUsers]
  );

  return (
    <div className={cx(styles.container)}>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={
          <div className="py-12">
            <Text type="tertiary">No users found</Text>
          </div>
        }
      />
    </div>
  );
});

PermissionListUsersContainer.displayName = 'PermissionListUsersContainer';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border: 0.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    overflow: hidden;
  `
}));

const PermissionGroupInfoCell = React.memo(({ name, email }: { name: string; email: string }) => {
  return (
    <div className="flex w-full items-center space-x-1.5">
      <div className="flex items-center space-x-2">
        <BusterUserAvatar size={18} name={name} />
      </div>

      <div className="flex flex-col space-y-0">
        <Text>{name}</Text>
        {email && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {email}
          </Text>
        )}
      </div>
    </div>
  );
});
PermissionGroupInfoCell.displayName = 'PermissionGroupInfoCell';

const options = [
  {
    label: 'Assigned',
    value: true
  },
  {
    label: 'Not Assigned',
    value: false
  }
];

const PermissionGroupAssignedCell = React.memo(
  ({
    id,
    assigned,
    onSelect
  }: {
    id: string;
    assigned: boolean;
    onSelect: (value: { id: string; assigned: boolean }) => void;
  }) => {
    return (
      <Select
        options={options}
        defaultValue={assigned}
        popupMatchSelectWidth
        onSelect={(value) => {
          onSelect({ id, assigned: value });
        }}
      />
    );
  },
  () => true
);

PermissionGroupAssignedCell.displayName = 'PermissionGroupAssignedCell';
