import {
  DataSource,
  SnowflakeCredentials,
  SnowflakeCredentialsSchema
} from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createSnowflakeDataSource,
  useCreateSnowflakeDataSource,
  useUpdateSnowflakeDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useDataSourceFormSuccess } from './helpers';

export const SnowflakeForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateSnowflakeDataSource();
  const { mutateAsync: updateDataSource } = useUpdateSnowflakeDataSource();
  const credentials = dataSource?.credentials as SnowflakeCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      account_id: credentials?.account_id || '',
      username: credentials?.username || '',
      password: credentials?.password || '',
      warehouse_id: credentials?.warehouse_id || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      role: credentials?.role || '',
      type: 'snowflake' as const,
      name: dataSource?.name || ''
    } as Parameters<typeof createSnowflakeDataSource>[0],
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
      onChangeAsync: SnowflakeCredentialsSchema,
      onSubmit: SnowflakeCredentialsSchema
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
            placeholder="My Snowflake"
          />
        )}
      />

      <form.AppField
        name="account_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Account ID"
            placeholder="your-account-id"
          />
        )}
      />

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="username" />}
        />
        <form.AppField
          name="password"
          children={(field) => <field.PasswordField label={null} placeholder="password" />}
        />
      </MultipleInlineFields>

      <form.AppField
        name="warehouse_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Warehouse ID"
            placeholder="your-warehouse-id"
          />
        )}
      />

      <form.AppField
        name="default_database"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database"
            placeholder="your_database"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="PUBLIC" />
        )}
      />

      <form.AppField
        name="role"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Role (Optional)"
            placeholder="your_role"
          />
        )}
      />
    </FormWrapper>
  );
};
