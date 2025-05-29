import {
  type DataSource,
  type SnowflakeCredentials,
  SnowflakeCredentialsSchema
} from '@/api/asset_interfaces';
import {
  type createSnowflakeDataSource,
  useCreateSnowflakeDataSource,
  useUpdateSnowflakeDataSource
} from '@/api/buster_rest/data_source';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import type React from 'react';
import { FormWrapper } from './FormWrapper';
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
        onUpdate: () => updateDataSource({ id: dataSource?.id || '', ...value }),
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
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Name"
            placeholder="My Snowflake"
          />
        )}
      </form.AppField>

      <form.AppField name="account_id">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Account ID"
            placeholder="your-account-id"
          />
        )}
      </form.AppField>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField name="username">
          {(field) => <field.TextField label={null} placeholder="username" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label={null} placeholder="password" />}
        </form.AppField>
      </MultipleInlineFields>

      <form.AppField name="warehouse_id">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Warehouse ID"
            placeholder="your-warehouse-id"
          />
        )}
      </form.AppField>

      <form.AppField name="default_database">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database"
            placeholder="your_database"
          />
        )}
      </form.AppField>

      <form.AppField name="default_schema">
        {(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="PUBLIC" />
        )}
      </form.AppField>

      <form.AppField name="role">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Role (Optional)"
            placeholder="your_role"
          />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
