import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import type { SQLServerCredentials } from '@/api/asset_interfaces/datasources';
import {
  type createSQLServerDataSource,
  useCreateSQLServerDataSource,
  useUpdateSQLServerDataSource,
} from '@/api/buster_rest/data_source';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const SqlServerForm: React.FC<{
  dataSource?: GetDataSourceResponse;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateSQLServerDataSource();
  const { mutateAsync: updateDataSource } = useUpdateSQLServerDataSource();
  const credentials = dataSource?.credentials as SQLServerCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 1433,
      username: credentials?.username || '',
      password: credentials?.password || '',
      default_database: credentials?.default_database || '',
      type: 'sqlserver' as const,
      name: dataSource?.name || '',
    } as SQLServerCredentials & { name: string },
    onSubmit: async ({ value }) => {
      await dataSourceFormSubmit({
        flow,
        dataSourceId: dataSource?.id,
        onUpdate: () => updateDataSource({ id: dataSource?.id || '', ...value }),
        onCreate: () => createDataSource(value),
      });
    },
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Name"
            placeholder="My SQL Server"
          />
        )}
      </form.AppField>

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField name="host">
          {(field) => <field.TextField label={null} placeholder="sqlserver.example.com" />}
        </form.AppField>
        <form.AppField name="port">
          {(field) => (
            <field.NumberField label={null} placeholder="1433" className="max-w-[75px]!" />
          )}
        </form.AppField>
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField name="username">
          {(field) => <field.TextField label={null} placeholder="sa" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label={null} placeholder="password" />}
        </form.AppField>
      </MultipleInlineFields>

      <form.AppField name="default_database">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database name"
            placeholder="master"
          />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
