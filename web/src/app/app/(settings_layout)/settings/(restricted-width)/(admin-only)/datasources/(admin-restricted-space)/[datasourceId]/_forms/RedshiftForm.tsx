import {
  type DataSource,
  type RedshiftCredentials,
  RedshiftCredentialsSchema
} from '@/api/asset_interfaces';
import {
  type createRedshiftDataSource,
  useCreateRedshiftDataSource,
  useUpdateRedshiftDataSource
} from '@/api/buster_rest/data_source';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import type React from 'react';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const RedshiftForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateRedshiftDataSource();
  const { mutateAsync: updateDataSource } = useUpdateRedshiftDataSource();
  const credentials = dataSource?.credentials as RedshiftCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 5439,
      username: credentials?.username || '',
      password: credentials?.password || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      type: 'redshift' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createRedshiftDataSource>[0],
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
      onChangeAsync: RedshiftCredentialsSchema,
      onSubmit: RedshiftCredentialsSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField name="name">
        {(field) => (
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My Redshift" />
        )}
      </form.AppField>

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField name="host">
          {(field) => (
            <field.TextField
              label={null}
              placeholder="cluster-name.region.redshift.amazonaws.com"
            />
          )}
        </form.AppField>
        <form.AppField name="port">
          {(field) => (
            <field.NumberField label={null} placeholder="5439" className="max-w-[75px]!" />
          )}
        </form.AppField>
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField name="username">
          {(field) => <field.TextField label={null} placeholder="awsuser" />}
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
            placeholder="dev"
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
