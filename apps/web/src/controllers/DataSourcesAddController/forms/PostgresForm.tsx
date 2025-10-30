import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import type { DataSourceTypes, PostgreSQLCredentials } from '@/api/asset_interfaces/datasources';
import {
  useCreatePostgresDataSource,
  useUpdatePostgresDataSource,
} from '@/api/buster_rest/data_source';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const PostgresForm: React.FC<{
  dataSource?: GetDataSourceResponse;
  type?: DataSourceTypes;
}> = ({ dataSource, type }) => {
  const { mutateAsync: createDataSource } = useCreatePostgresDataSource();
  const { mutateAsync: updateDataSource } = useUpdatePostgresDataSource();
  const credentials = dataSource?.credentials as PostgreSQLCredentials | undefined;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host,
      port: credentials?.port || 5432,
      username: credentials?.username,
      password: credentials?.password,
      default_database: credentials?.default_database,
      default_schema: credentials?.default_schema,
      type: credentials?.type || type || 'postgres',
      name: dataSource?.name,
    } as PostgreSQLCredentials & { name: string },
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
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My Postgres" />
        )}
      </form.AppField>

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField name="host">
          {(field) => <field.TextField label={null} placeholder="www.example.com" />}
        </form.AppField>
        <form.AppField name="port">
          {(field) => (
            <field.NumberField label={null} placeholder="5432" className="max-w-[75px]!" />
          )}
        </form.AppField>
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField name="username">
          {(field) => <field.TextField label={null} placeholder="postgres" />}
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
            placeholder="postgres"
          />
        )}
      </form.AppField>

      <form.AppField name="default_schema">
        {(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="public" />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
