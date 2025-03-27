'use client';

import { DatabaseNames, type DataSource, type DataSourceTypes } from '@/api/asset_interfaces';
import React from 'react';
import { PostgresForm } from './PostgresForm';
import { MySqlForm } from './MySqlForm';
import { BigQueryForm } from './BigQueryForm';
import { SnowflakeForm } from './SnowflakeForm';
import { RedshiftForm } from './RedshiftForm';
import { DataBricksForm } from './DataBricksForm';
import { SqlServerForm } from './SqlServerForm';
import { Text } from '@/components/ui/typography';

const FormRecord: Record<
  DataSourceTypes,
  React.FC<{
    dataSource?: DataSource;
    type?: DataSourceTypes;
  }>
> = {
  postgres: PostgresForm,
  mysql: MySqlForm,
  bigquery: BigQueryForm,
  snowflake: SnowflakeForm,
  redshift: RedshiftForm,
  mariadb: MySqlForm,
  sqlserver: SqlServerForm,
  databricks: DataBricksForm,
  supabase: PostgresForm,
  athena: () => <></>,
  other: () => <></>
};

export const DataSourceFormContent: React.FC<{
  dataSource?: DataSource;
  type: DataSourceTypes;
}> = React.memo(({ dataSource, type }) => {
  const SelectedForm = FormRecord[type];
  const DatabaseName = DatabaseNames[type];

  return (
    <div className="overflow-hidden rounded-lg border shadow">
      <div className="bg-item-hover flex items-center space-x-2 px-4 py-2.5">
        <Text>{`${DatabaseName} credentials`}</Text>
      </div>

      <div className="p-4">
        {SelectedForm && <SelectedForm dataSource={dataSource} type={type} />}
      </div>
    </div>
  );
});

DataSourceFormContent.displayName = 'DataSourceFormContent';
