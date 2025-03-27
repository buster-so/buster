'use client';

import React from 'react';
import { AppDataSourceIcon } from '@/components/ui/icons/AppDataSourceIcons';
import type { DataSourceListItem } from '@/api/asset_interfaces';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Text } from '@/components/ui/typography';
import { useUserConfigContextSelector } from '@/context/Users';
import { Button } from '@/components/ui/buttons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Plus, Dots, Trash } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';
import { useDeleteDatasource, useListDatasources } from '@/api/buster_rest/data_source';
import { ListEmptyStateWithButton } from '@/components/ui/list';

export const DatasourceList: React.FC = () => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
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
          linkButton={createBusterRoute({
            route: BusterRoutes.SETTINGS_DATASOURCES_ADD
          })}
        />
      )}
    </div>
  );
};

const AddSourceHeader: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  return (
    <div className="flex w-full justify-between">
      <Text>Your data sources</Text>
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_DATASOURCES_ADD
        })}>
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
  const { mutateAsync: onDeleteDataSource, isPending: isDeleting } = useDeleteDatasource();

  const dropdownItems: DropdownItems = [
    {
      label: 'Delete',
      value: 'delete',
      icon: <Trash />,
      onClick: async () => {
        onDeleteDataSource(source.id);
      }
    }
  ];

  return (
    <Link
      href={createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES_ID,
        datasourceId: source.id
      })}>
      <div
        className={cn(
          'flex w-full items-center justify-between space-x-4',
          'cursor-pointer',
          'bg-background hover:bg-item-hover rounded border px-4 py-2'
        )}>
        <div className="flex items-center space-x-4">
          <AppDataSourceIcon type={source.type} size={24} />
          <Text variant="secondary">{source.name}</Text>
        </div>

        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}>
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
        </span>
      </div>
    </Link>
  );
});

ListItem.displayName = 'ListItem';
