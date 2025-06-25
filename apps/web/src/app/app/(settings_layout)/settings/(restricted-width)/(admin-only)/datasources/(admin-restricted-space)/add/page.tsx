'use client';

import Link from 'next/link';
import type React from 'react';
import { useEffect, useState } from 'react';
import { DatabaseNames, type DataSourceTypes, SUPPORTED_DATASOURCES } from '@/api/asset_interfaces';
import { AppDataSourceIcon } from '@/components/ui/icons/AppDataSourceIcons';
import { Text, Title } from '@/components/ui/typography';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { HeaderContainer } from '../../_HeaderContainer';
import { DataSourceFormContent } from '../[datasourceId]/_forms/DatasourceFormContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datasources'
};

export default function Page({
  searchParams: { type }
}: {
  searchParams: { type?: DataSourceTypes };
}) {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceTypes | null>(
    getValidType(type)
  );

  const linkUrl = selectedDataSource
    ? createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES_ADD
      })
    : createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES
      });

  const onClearSelectedDataSource = useMemoizedFn(() => {
    setSelectedDataSource(null);
    onChangePage({ route: BusterRoutes.SETTINGS_DATASOURCES_ADD });
  });

  useEffect(() => {
    if (getValidType(type)) {
      setSelectedDataSource(getValidType(type));
    }
  }, [type]);

  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText={selectedDataSource ? 'Connect a datasource' : 'Datasources'}
        onClick={onClearSelectedDataSource}
        linkUrl={linkUrl}
      />

      {selectedDataSource ? (
        <DataSourceFormContent type={selectedDataSource} dataSource={undefined} />
      ) : (
        <div className="flex flex-col space-y-6">
          <ConnectHeader />
          <DataSourceList />
        </div>
      )}
    </div>
  );
}

const ConnectHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-1">
      <Title as="h3">{'Connect a datasource'}</Title>
      <Text variant="secondary">{"Select the datasource you'd like to connect"}</Text>
    </div>
  );
};

const DataSourceList: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {SUPPORTED_DATASOURCES.map((dataSource) => {
        const name = DatabaseNames[dataSource];
        return (
          <Link
            href={`${createBusterRoute({
              route: BusterRoutes.SETTINGS_DATASOURCES_ADD
            })}?type=${dataSource}`}
            key={dataSource}
            className={cn(
              'flex cursor-pointer items-center space-x-4 px-4 py-3 shadow transition',
              'bg-background hover:bg-item-hover',
              'border-border max-h-[48px] rounded border'
            )}>
            <AppDataSourceIcon size={28} type={dataSource} />
            <Text>{name}</Text>
          </Link>
        );
      })}
    </div>
  );
};

const getValidType = (type: string | undefined) => {
  return SUPPORTED_DATASOURCES.includes(type as DataSourceTypes) ? (type as DataSourceTypes) : null;
};
