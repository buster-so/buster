'use client';

import { useDataSourceContextSelector } from '@/context/DataSources';
import React from 'react';
import { Button, Dropdown, Skeleton } from 'antd';
import { AppMaterialIcons } from '@/components';
import { useAntToken } from '@/styles/useAntToken';
import { AppDataSourceIcon } from '@/components/icons/AppDataSourceIcons';
import { DataSourceListItem } from '@/api/buster_rest';
import { createStyles } from 'antd-style';
import { MenuProps } from 'antd/lib';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMount } from 'ahooks';
import { Text } from '@/components';
import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const DatasourceList: React.FC = () => {
  const dataSourcesList = useDataSourceContextSelector((state) => state.dataSourcesList);
  const loadingDatasources = useDataSourceContextSelector((state) => state.loadingDatasources);
  const initDataSourceList = useDataSourceContextSelector((state) => state.initDataSourceList);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const hasDataSources = dataSourcesList.length > 0 && !loadingDatasources;

  useMount(() => {
    initDataSourceList();
  });

  return (
    <div className="flex flex-col space-y-4">
      <AddSourceHeader />

      {loadingDatasources ? (
        <SkeletonLoader />
      ) : hasDataSources ? (
        <DataSourceItems sources={dataSourcesList} />
      ) : (
        <SettingsEmptyState
          title={`You don't have any data sources yet.`}
          description={`You don’t have any datasources. As soon as you do, they will start to  appear here.`}
          buttonText="New datasource"
          buttonIcon={<AppMaterialIcons icon="add" />}
          buttonAction={() =>
            onChangePage({
              route: BusterRoutes.SETTINGS_DATASOURCES_ADD
            })
          }
        />
      )}
    </div>
  );
};

const AddSourceHeader: React.FC<{}> = () => {
  return (
    <div className="flex w-full justify-between">
      <Text>Your data sources</Text>
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_DATASOURCES_ADD
        })}>
        <Button type="text" icon={<AppMaterialIcons icon="add" />}>
          New datasource
        </Button>
      </Link>
    </div>
  );
};

const useStyle = createStyles(({ css, token }) => {
  return {
    item: css`
      background: ${token.colorBgBase};
      &:hover {
        background: ${token.controlItemBgHover};
      }
    `
  };
});

const DataSourceItems: React.FC<{ sources: DataSourceListItem[] }> = ({ sources }) => {
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
}> = ({ source }) => {
  const token = useAntToken();
  const { styles, cx } = useStyle();
  const onDeleteDataSource = useDataSourceContextSelector((state) => state.onDeleteDataSource);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete',
      icon: <AppMaterialIcons icon="delete" />,
      onClick: async () => {
        await onDeleteDataSource(source.id);
      }
    }
  ];

  return (
    <Link
      href={createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES_ID,
        datasourceId: source.id
      })}
      key={source.id}>
      <div
        className={cx(
          'flex w-full items-center justify-between space-x-4',
          'cursor-pointer',
          styles.item
        )}
        style={{
          borderRadius: `${token.borderRadius}px`,
          border: `0.5px solid ${token.colorBorder}`,
          padding: `${token.paddingContentVertical}px ${token.paddingContentHorizontal}px`
        }}>
        <div className="flex items-center space-x-4">
          <AppDataSourceIcon type={source.type} size={24} />
          <Text type="secondary">{source.name}</Text>
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}>
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownItems
            }}>
            <AppMaterialIcons icon="more_horiz" />
          </Dropdown>
        </div>
      </div>
    </Link>
  );
};

const SkeletonLoader: React.FC<{}> = () => {
  return (
    <div className="flex flex-col space-y-4">
      <Skeleton.Input className="!h-[50px] !w-full" />
      <Skeleton.Input className="!h-[50px] !w-full" />
      <Skeleton.Input className="!h-[50px] !w-full" />
    </div>
  );
};
