import React, { useMemo } from 'react';
import type { BusterUserAttribute } from '@/api/asset_interfaces/users';
import {
  type BusterListColumn,
  type BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';

export const UserAttributesListContainer: React.FC<{
  filteredAttributes: BusterUserAttribute[];
  userId: string;
}> = React.memo(({ filteredAttributes, userId }) => {
  const columns: BusterListColumn<BusterUserAttribute>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 320
      },
      {
        title: 'Value',
        dataIndex: 'value'
      }
    ],
    []
  );

  const rows: BusterListRowItem<BusterUserAttribute>[] = useMemo(
    () =>
      filteredAttributes.map((attribute) => ({
        id: attribute.name,
        data: attribute
      })),
    [filteredAttributes]
  );

  return (
    <InfiniteListContainer>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={true}
        showSelectAll={false}
        useRowClickSelectChange={false}
        emptyState={useMemo(
          () => (
            <EmptyStateList text="No datasets found" />
          ),
          []
        )}
      />
    </InfiniteListContainer>
  );
});

UserAttributesListContainer.displayName = 'UserDatasetsListContainer';
