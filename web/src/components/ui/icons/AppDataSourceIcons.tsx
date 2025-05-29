import { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import type React from 'react';
import { Database } from './NucleoIconOutlined';
import { AthenaIcon } from './customIcons/athena';
import { BigQueryIcon } from './customIcons/bigquery';
import { DataBricks } from './customIcons/databricks';
import { MariaDB } from './customIcons/mariadb';
import { MySQLIcon } from './customIcons/mysql';
import { PostgresIcon } from './customIcons/postgres';
import { RedUsersIcons } from './customIcons/redUsers';
import { RedshiftIcon } from './customIcons/redshift';
import { SnowflakeIcon } from './customIcons/snowflake';
import { SqlServer } from './customIcons/sqlserver';
import { SupabaseIcon } from './customIcons/supabase';

const IconRecord: Record<DataSourceTypes, React.FC<Parameters<typeof PostgresIcon>[0]>> = {
  [DataSourceTypes.postgres]: PostgresIcon,
  [DataSourceTypes.mysql]: MySQLIcon,
  [DataSourceTypes.bigquery]: BigQueryIcon,
  [DataSourceTypes.snowflake]: SnowflakeIcon,
  [DataSourceTypes.redshift]: RedshiftIcon,
  [DataSourceTypes.mariadb]: MariaDB,
  [DataSourceTypes.sqlserver]: SqlServer,
  [DataSourceTypes.databricks]: DataBricks,
  [DataSourceTypes.supabase]: SupabaseIcon,
  [DataSourceTypes.athena]: AthenaIcon,
  [DataSourceTypes.other]: RedUsersIcons
};

export const AppDataSourceIcon: React.FC<{
  size?: number;
  type: DataSourceTypes;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ type, ...props }) => {
  const ChosenIcon = IconRecord[type];

  if (!ChosenIcon) {
    return <Database />;
  }

  return <ChosenIcon {...props} />;
};
