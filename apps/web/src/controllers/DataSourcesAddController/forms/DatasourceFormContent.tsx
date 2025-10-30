import type { GetDataSourceResponse } from '@buster/server-shared';
import React from 'react';
import { DatabaseNames, type DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { Text } from '@/components/ui/typography';
import { BigQueryForm } from './BigQueryForm';
// import { DataBricksForm } from './DataBricksForm'; // Disabled: Databricks adapter not yet implemented
import { MotherDuckForm } from './MotherDuckForm';
import { MySqlForm } from './MySqlForm';
import { PostgresForm } from './PostgresForm';
import { RedshiftForm } from './RedshiftForm';
import { SnowflakeForm } from './SnowflakeForm';
import { SqlServerForm } from './SqlServerForm';

const FormRecord: Record<
  DataSourceTypes,
  React.FC<{
    dataSource?: GetDataSourceResponse;
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
  databricks: () => null, // Disabled: Databricks adapter not yet implemented
  motherduck: MotherDuckForm,
  supabase: PostgresForm,
  athena: () => null,
  other: () => null,
};

export const DataSourceFormContent: React.FC<{
  dataSource?: GetDataSourceResponse;
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
