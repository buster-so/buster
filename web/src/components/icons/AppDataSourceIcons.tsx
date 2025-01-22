import { PostgresIcon } from './customIcons/postgres';
import { MySQLIcon } from './customIcons/mysql';
import { SnowflakeIcon } from './customIcons/snowflake';
import { BigQueryIcon } from './customIcons/bigquery';
import { RedshiftIcon } from './customIcons/redshift';
import { MariaDB } from './customIcons/mariadb';
import { SqlServer } from './customIcons/sqlserver';
import { DataBricks } from './customIcons/databricks';
import { SupabaseIcon } from './customIcons/supabase';
import { RedUsersIcons } from './customIcons/redUsers';
import { AthenaIcon } from './customIcons/athena';
import React from 'react';
import { DataSourceTypes } from '@/api/buster_rest';
import { AppMaterialIcons } from './AppMaterialIcons';

const IconRecord: Record<DataSourceTypes, any> = {
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

  console;

  if (!ChosenIcon) {
    return <AppMaterialIcons {...props} icon="database" />;
  }

  return (
    <>
      <ChosenIcon {...props} />
    </>
  );
};
