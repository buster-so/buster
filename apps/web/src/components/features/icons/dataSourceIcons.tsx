import type React from 'react';
import { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { AthenaIcon } from '../../ui/icons/customIcons/athena';
import { BigQueryIcon } from '../../ui/icons/customIcons/bigquery';
import { DataBricks } from '../../ui/icons/customIcons/databricks';
import { MariaDB } from '../../ui/icons/customIcons/mariadb';
import { MotherDuckIcon } from '../../ui/icons/customIcons/motherduck';
import { MySQLIcon } from '../../ui/icons/customIcons/mysql';
import { PostgresIcon } from '../../ui/icons/customIcons/postgres';
import { RedshiftIcon } from '../../ui/icons/customIcons/redshift';
import { RedUsersIcons } from '../../ui/icons/customIcons/redUsers';
import { SnowflakeIcon } from '../../ui/icons/customIcons/snowflake';
import { SqlServer } from '../../ui/icons/customIcons/sqlserver';
import { SupabaseIcon } from '../../ui/icons/customIcons/supabase';
import { Database } from '../../ui/icons/NucleoIconOutlined';

const IconRecord: Record<DataSourceTypes, React.FC<Parameters<typeof PostgresIcon>[0]>> = {
  [DataSourceTypes.postgres]: PostgresIcon,
  [DataSourceTypes.mysql]: MySQLIcon,
  [DataSourceTypes.bigquery]: BigQueryIcon,
  [DataSourceTypes.snowflake]: SnowflakeIcon,
  [DataSourceTypes.redshift]: RedshiftIcon,
  [DataSourceTypes.mariadb]: MariaDB,
  [DataSourceTypes.sqlserver]: SqlServer,
  [DataSourceTypes.databricks]: DataBricks,
  [DataSourceTypes.motherduck]: MotherDuckIcon,
  [DataSourceTypes.supabase]: SupabaseIcon,
  [DataSourceTypes.athena]: AthenaIcon,
  [DataSourceTypes.other]: RedUsersIcons,
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
