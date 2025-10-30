import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import type { DataSourceTypes, MotherDuckCredentials } from '@/api/asset_interfaces/datasources';
import {
  useCreateMotherDuckDataSource,
  useUpdateMotherDuckDataSource,
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const MotherDuckForm: React.FC<{
  dataSource?: GetDataSourceResponse;
  type?: DataSourceTypes;
}> = ({ dataSource, type }) => {
  const { mutateAsync: createDataSource } = useCreateMotherDuckDataSource();
  const { mutateAsync: updateDataSource } = useUpdateMotherDuckDataSource();
  const credentials = dataSource?.credentials as MotherDuckCredentials | undefined;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      token: credentials?.token,
      default_database: credentials?.default_database,
      type: credentials?.type || type || 'motherduck',
      name: dataSource?.name,
    } as MotherDuckCredentials & { name: string },
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
            placeholder="My MotherDuck Database"
          />
        )}
      </form.AppField>

      <form.AppField name="token">
        {(field) => (
          <field.PasswordField
            labelClassName={labelClassName}
            label="Service Token"
            placeholder="motherduck_token_..."
          />
        )}
      </form.AppField>

      <form.AppField name="default_database">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database name"
            placeholder="my_db"
          />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
