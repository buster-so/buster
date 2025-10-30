import type { DataSourceListItem } from '@buster/server-shared';
import { Link } from '@tanstack/react-router';
import React from 'react';
import type { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { useDeleteDatasource, useListDatasources } from '@/api/buster_rest/data_source';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { AppDataSourceIcon } from '@/components/features/icons/dataSourceIcons';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Dots, Plus, Trash } from '@/components/ui/icons';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const DatasourceList: React.FC = () => {
  const isAdmin = useIsUserAdmin();
  const { data: dataSourcesList, isFetched: isFetchedDatasourcesList } = useListDatasources();
  const hasDataSources = dataSourcesList.length > 0;

  if (!isFetchedDatasourcesList) {
    return;
  }

  return (
    <div className="flex flex-col space-y-4">
      <AddSourceHeader isAdmin={isAdmin} />

      {hasDataSources ? (
        <DataSourceItems sources={dataSourcesList} />
      ) : (
        <ListEmptyStateWithButton
          title="You don't have any data sources yet."
          description="You don’t have any datasources. As soon as you do, they will start to  appear here."
          buttonText="New datasource"
          link={{
            to: '/app/settings/datasources/add',
          }}
        />
      )}
    </div>
  );
};

const AddSourceHeader: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  return (
    <div className="flex w-full justify-between">
      <Text>Your data sources</Text>
      <Link to={'/app/settings/datasources/add'}>
        {isAdmin && (
          <Button variant="ghost" prefix={<Plus />}>
            New datasource
          </Button>
        )}
      </Link>
    </div>
  );
};

const DataSourceItems: React.FC<{
  sources: DataSourceListItem[];
}> = ({ sources }) => {
  return (
    <div className="flex flex-col space-y-4">
      {sources.map((source) => {
        return <ListItem key={source.id} source={source} />;
      })}
    </div>
  );
};

const ListItem: React.FC<{
  source: DataSourceListItem;
}> = React.memo(({ source }) => {
  const { mutateAsync: onDeleteDataSource } = useDeleteDatasource();

  const dropdownItems: IDropdownItems = [
    {
      label: 'Delete',
      value: 'delete',
      icon: <Trash />,
      onClick: async () => {
        onDeleteDataSource(source.id);
      },
    },
  ];

  return (
    <Link
      to={'/app/settings/datasources/$datasourceId'}
      params={{
        datasourceId: source.id,
      }}
    >
      <div
        className={cn(
          'flex w-full items-center justify-between space-x-4',
          'cursor-pointer',
          'bg-background hover:bg-item-hover rounded border px-4 py-2'
        )}
      >
        <div className="flex items-center space-x-4">
          <AppDataSourceIcon type={source.type as DataSourceTypes} size={24} />
          <Text variant="secondary">{source.name}</Text>
        </div>

        <div>
          <Dropdown items={dropdownItems} align="end" side="bottom">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              prefix={<Dots />}
            />
          </Dropdown>
        </div>
      </div>
    </Link>
  );
});

ListItem.displayName = 'ListItem';
