'use client';

import { DataSource } from '@/api/buster-rest';
import { AppMaterialIcons, PulseLoader } from '@/components';
import { AppDataSourceIcon } from '@/components/icons/AppDataSourceIcons';
import { useAntToken } from '@/styles/useAntToken';
import { formatDate } from '@/utils';
import { Button, Divider, Dropdown, MenuProps } from 'antd';
import React from 'react';
import { DataSourceFormContent } from './_DatasourceFormContent';
import { useDataSourceContextSelector, useDataSourceIndividual } from '@/context/DataSources';
import { Text, Title } from '@/components';

export const DatasourceForm: React.FC<{ datasourceId: string }> = ({ datasourceId }) => {
  const { dataSource } = useDataSourceIndividual({ dataSourceId: datasourceId });
  const loadingDataSource = !dataSource?.id;

  if (loadingDataSource) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col space-y-3">
      <DataSourceFormHeader dataSource={dataSource} />
      <DataSourceFormStatus dataSource={dataSource} />
      <DataSourceFormContent dataSource={dataSource} type={dataSource.db_type} />
    </div>
  );
};

const DataSourceFormHeader: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
  return (
    <div className="flex justify-between space-x-2">
      <div className="flex space-x-4">
        <div>
          <AppDataSourceIcon size={55} type={dataSource.db_type} />
        </div>

        <div className="flex flex-col space-y-1">
          <Title level={4}>{dataSource.name}</Title>
          <Text type="secondary">
            Last updated{' '}
            {formatDate({
              date: dataSource.updated_at || dataSource.created_at,
              format: 'LLL'
            })}
          </Text>
        </div>
      </div>

      {/* <ThreeDotsMenu dataSource={dataSource} /> */}
    </div>
  );
};

const ThreeDotsMenu: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
  const onDeleteDataSource = useDataSourceContextSelector((state) => state.onDeleteDataSource);
  const token = useAntToken();
  const items: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete',
      icon: <AppMaterialIcons icon="delete" />,
      onClick: async () => {
        await onDeleteDataSource(dataSource.id);
      }
    }
  ];
  const contentStyle: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary
  };

  const menuStyle: React.CSSProperties = {
    boxShadow: 'none'
  };

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items
      }}
      dropdownRender={(menu) => (
        <div style={contentStyle}>
          <div
            style={{
              height: 38
            }}
            className="flex items-center space-x-2 px-3.5">
            <PulseLoader color={token.colorSuccess} size={10} />
            <Text>Connection status</Text>
          </div>
          <Divider style={{ margin: 0 }} />
          {React.cloneElement(menu as React.ReactElement, { style: menuStyle })}
        </div>
      )}>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />}></Button>
    </Dropdown>
  );
};

const DataSourceFormStatus: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
  const token = useAntToken();
  const [isOpenDropdown, setIsOpenDropdown] = React.useState(false);
  const onDeleteDataSource = useDataSourceContextSelector((state) => state.onDeleteDataSource);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete',
      icon: <AppMaterialIcons icon="delete" />,
      onClick: async () => {
        await onDeleteDataSource(dataSource.id);
      }
    }
  ];

  return (
    <div
      className="flex w-full items-center justify-between space-x-3"
      style={{
        background: token.colorBgBase,
        border: `0.5px solid ${token.colorBorder}`,
        borderRadius: `${token.borderRadius}px`,
        padding: `${token.paddingContentVertical}px ${token.paddingContentHorizontal}px`
      }}>
      <div className="flex flex-col">
        <Text>Connection status</Text>
        <Text type="secondary">{`Connected on ${formatDate({
          date: dataSource.created_at,
          format: 'LL'
        })}`}</Text>
      </div>

      <div className="">
        <Dropdown
          trigger={['click']}
          menu={{
            items: dropdownItems
          }}
          onOpenChange={(open) => setIsOpenDropdown(open)}>
          <div className="!flex cursor-pointer items-center space-x-2 pl-2">
            <PulseLoader color={token.colorSuccess} size={10} />
            <Text className="select-none">Connected</Text>
            <AppMaterialIcons
              size={16}
              icon="keyboard_arrow_down"
              className="transition"
              style={{
                transform: `rotate(${isOpenDropdown ? 180 : 0}deg)`
              }}
            />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

const SkeletonLoader: React.FC = () => {
  return <div>{/* <Skeleton /> */}</div>;
};
