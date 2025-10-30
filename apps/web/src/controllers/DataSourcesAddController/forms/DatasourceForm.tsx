import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import type { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { useDeleteDatasource, useGetDatasource } from '@/api/buster_rest/data_source';
import { AppDataSourceIcon } from '@/components/features/icons/dataSourceIcons';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Trash } from '@/components/ui/icons';
import { PulseLoader } from '@/components/ui/loaders';
import { Text, Title } from '@/components/ui/typography';
import { formatDate } from '@/lib/date';
import { DataSourceFormContent } from './DatasourceFormContent';

export const DatasourceForm: React.FC<{ datasourceId: string }> = ({ datasourceId }) => {
  const { data: dataSource, isFetched: isFetchedDataSource } = useGetDatasource(datasourceId);

  if (!isFetchedDataSource || !dataSource) {
    return;
  }

  return (
    <div className="flex flex-col space-y-3">
      <DataSourceFormHeader dataSource={dataSource} />
      <DataSourceFormStatus dataSource={dataSource} />
      <DataSourceFormContent dataSource={dataSource} type={dataSource?.type as DataSourceTypes} />
    </div>
  );
};

const DataSourceFormHeader: React.FC<{ dataSource: GetDataSourceResponse }> = ({ dataSource }) => {
  return (
    <div className="flex justify-between space-x-2">
      <div className="flex items-center space-x-4">
        <div className="text-icon-color text-4xl">
          <AppDataSourceIcon size={32} type={dataSource.type as DataSourceTypes} />
        </div>

        <div className="flex flex-col space-y-1">
          <Title as="h4">{dataSource.name}</Title>
          <Text variant="secondary">
            Last updated{' '}
            {formatDate({
              date: dataSource.updatedAt || dataSource.createdAt,
              format: 'LLL',
            })}
          </Text>
        </div>
      </div>
    </div>
  );
};

const DataSourceFormStatus: React.FC<{ dataSource: GetDataSourceResponse }> = ({ dataSource }) => {
  const { mutateAsync: onDeleteDataSource } = useDeleteDatasource();

  const dropdownItems: IDropdownItems = [
    {
      value: 'delete',
      label: 'Delete',
      icon: <Trash />,
      onClick: async () => {
        await onDeleteDataSource(dataSource.id);
      },
    },
  ];

  return (
    <div className="flex w-full items-center justify-between space-x-3 rounded border p-4">
      <div className="flex flex-col">
        <Text>Connection status</Text>
        <Text variant="secondary">{`Connected on ${formatDate({
          date: dataSource.createdAt,
          format: 'LL',
        })}`}</Text>
      </div>

      <div className="">
        <Dropdown items={dropdownItems} align="end" side="bottom">
          <div className="flex! cursor-pointer items-center space-x-2 pl-2">
            <PulseLoader className="text-success-foreground" size={10} />
            <Text className="select-none">Connected</Text>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};
