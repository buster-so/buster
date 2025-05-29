import {
  type DataSource,
  type MySQLCredentials,
  MySQLCredentialsSchema
} from '@/api/asset_interfaces';
import {
  type createMySQLDataSource,
  useCreateMySQLDataSource,
  useUpdateMySQLDataSource
} from '@/api/buster_rest/data_source';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import type React from 'react';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const MySqlForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateMySQLDataSource();
  const { mutateAsync: updateDataSource } = useUpdateMySQLDataSource();
  const credentials = dataSource?.credentials as MySQLCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 3306,
      username: credentials?.username || '',
      password: credentials?.password || '',
      default_database: credentials?.default_database || '',
      type: 'mysql' as const,
      name: dataSource?.name || credentials?.name || ''
    } as Parameters<typeof createMySQLDataSource>[0],
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
      onChangeAsync: MySQLCredentialsSchema,
      onSubmit: MySQLCredentialsSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField name="name">
        {(field) => (
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My MySQL" />
        )}
      </form.AppField>

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField name="host">
          {(field) => <field.TextField label={null} placeholder="mysql.example.com" />}
        </form.AppField>
        <form.AppField name="port">
          {(field) => (
            <field.NumberField label={null} placeholder="3306" className="max-w-[75px]!" />
          )}
        </form.AppField>
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField name="username">
          {(field) => <field.TextField label={null} placeholder="root" />}
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
            placeholder="mydatabase"
          />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
