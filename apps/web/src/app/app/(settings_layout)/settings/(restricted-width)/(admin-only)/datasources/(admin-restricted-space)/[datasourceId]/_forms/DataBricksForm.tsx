import type React from 'react';
import {
  type DatabricksCredentials,
  DatabricksCredentialsSchema,
  type DataSource
} from '@/api/asset_interfaces/datasources';
import {
  type createDatabricksDataSource,
  useCreateDatabricksDataSource,
  useUpdateDatabricksDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const DataBricksForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateDatabricksDataSource();
  const { mutateAsync: updateDataSource } = useUpdateDatabricksDataSource();
  const credentials = dataSource?.credentials as DatabricksCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      api_key: credentials?.api_key || '',
      warehouse_id: credentials?.warehouse_id || '',
      default_catalog: credentials?.default_catalog || '',
      default_schema: credentials?.default_schema || '',
      type: 'databricks' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createDatabricksDataSource>[0],
    onSubmit: async ({ value }) => {
      await dataSourceFormSubmit({
        flow,
        dataSourceId: dataSource?.id,
        onUpdate: () => updateDataSource({ id: dataSource?.id || '', ...value }),
        onCreate: () => createDataSource(value)
      });
    },
    validators: {
      onChangeAsyncDebounceMs: 1000,
      onChangeAsync: DatabricksCredentialsSchema,
      onSubmit: DatabricksCredentialsSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Name"
            placeholder="My Databricks"
          />
        )}
      </form.AppField>

      <form.AppField name="host">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Host"
            placeholder="your-workspace.cloud.databricks.com"
          />
        )}
      </form.AppField>

      <form.AppField name="api_key">
        {(field) => (
          <field.PasswordField
            labelClassName={labelClassName}
            label="API Key"
            placeholder="dapi..."
          />
        )}
      </form.AppField>

      <form.AppField name="warehouse_id">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Warehouse ID"
            placeholder="your-warehouse-id"
          />
        )}
      </form.AppField>

      <form.AppField name="default_catalog">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Catalog"
            placeholder="hive_metastore"
          />
        )}
      </form.AppField>

      <form.AppField name="default_schema">
        {(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="default" />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
