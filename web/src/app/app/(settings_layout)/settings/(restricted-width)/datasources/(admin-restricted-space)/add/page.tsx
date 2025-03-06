'use client';

import React from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { HeaderContainer } from '../../_HeaderContainer';
import { useState } from 'react';
import { DatabaseNames, DataSourceTypes, SUPPORTED_DATASOURCES } from '@/api/asset_interfaces';
import { AppDataSourceIcon } from '@/components/ui/icons';
import { useAntToken } from '@/styles/useAntToken';
import { createStyles } from 'antd-style';
import { DataSourceFormContent } from '../[datasourceId]/_DatasourceFormContent';
import { Title, Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';

export default function Page() {
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceTypes | null>(null);
  const { openInfoMessage } = useBusterNotifications();

  const linkUrl = selectedDataSource
    ? ''
    : createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES
      });

  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText={selectedDataSource ? 'Connect a datasource' : 'Datasources'}
        onClick={() => setSelectedDataSource(null)}
        linkUrl={linkUrl}
      />

      {selectedDataSource ? (
        <DataSourceFormContent type={selectedDataSource} useConnection={true} />
      ) : (
        <div className="flex flex-col space-y-6">
          <ConnectHeader />
          <DataSourceList
            onSelect={(v) => {
              if (SUPPORTED_DATASOURCES.includes(v)) {
                setSelectedDataSource(v);
              } else {
                openInfoMessage('This data source is not currently supported');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

const ConnectHeader: React.FC<{}> = ({}) => {
  return (
    <div className="flex flex-col space-y-1">
      <Title as="h3">{`Connect a datasource`}</Title>
      <Text variant="secondary">{`Select the datasource you’d like to connect`}</Text>
    </div>
  );
};

const useStyles = createStyles(({ css, token }) => ({
  item: css`
    background: ${token.colorBgBase};
    &:hover {
      background: ${token.controlItemBgHover};
    }
  `
}));

const DataSourceList: React.FC<{
  onSelect: (dataSource: DataSourceTypes) => void;
}> = ({ onSelect }) => {
  const token = useAntToken();
  const { styles, cx } = useStyles();

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.values(DataSourceTypes).map((dataSource) => {
        const name = DatabaseNames[dataSource];
        return (
          <div
            onClick={() => onSelect(dataSource)}
            key={dataSource}
            className={cx(
              'flex cursor-pointer items-center space-x-4 px-4 py-3 transition',
              styles.item
            )}
            style={{
              maxHeight: 48,
              borderRadius: token.borderRadius,
              border: `0.5px solid ${token.colorBorder}`
            }}>
            <AppDataSourceIcon size={28} type={dataSource} />
            <Text>{name}</Text>
          </div>
        );
      })}
    </div>
  );
};
