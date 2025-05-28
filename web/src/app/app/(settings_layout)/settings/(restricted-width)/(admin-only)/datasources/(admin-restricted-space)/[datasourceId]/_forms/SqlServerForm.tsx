import {
  type DataSource,
  type SQLServerCredentials,
  SQLServerCredentialsSchema
} from '@/api/asset_interfaces';
import type React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  type createSQLServerDataSource,
  useCreateSQLServerDataSource,
  useUpdateSQLServerDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useDataSourceFormSuccess } from './helpers';

export const SqlServerForm: React.FC<{
  dataSource?: DataSource;
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
      default_schema: credentials?.default_schema || '',
      type: 'sqlserver' as const,
      name: dataSource?.name || credentials?.name || ''
    } as Parameters<typeof createSQLServerDataSource>[0],
    onSubmit: async ({ value }) => {
      await dataSourceFormSubmit({
        flow,
        dataSourceId: dataSource?.id,
        onUpdate: () => updateDataSource({ id: dataSource!.id, ...value }),
        onCreate: () => createDataSource(value)
      });
    },
    validators: {
      onChangeAsyncDebounceMs: 1000,
      onChangeAsync: SQLServerCredentialsSchema,
      onSubmit: SQLServerCredentialsSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Name"
            placeholder="My SQL Server"
          />
        )}
      />

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField
          name="host"
          children={(field) => <field.TextField label={null} placeholder="sqlserver.example.com" />}
        />
        <form.AppField
          name="port"
          children={(field) => (
            <field.NumberField label={null} placeholder="1433" className="max-w-[75px]!" />
          )}
        />
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="sa" />}
        />
        <form.AppField
          name="password"
          children={(field) => <field.PasswordField label={null} placeholder="password" />}
        />
      </MultipleInlineFields>

      <form.AppField
        name="default_database"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database name"
            placeholder="master"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="dbo" />
        )}
      />
    </FormWrapper>
  );
};
