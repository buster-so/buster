import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import type { BigQueryCredentials } from '@/api/asset_interfaces/datasources';
import {
  type createBigQueryDataSource,
  useCreateBigQueryDataSource,
  useUpdateBigQueryDataSource,
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const BigQueryForm: React.FC<{
  dataSource?: GetDataSourceResponse;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateBigQueryDataSource();
  const { mutateAsync: updateDataSource } = useUpdateBigQueryDataSource();
  const credentials = dataSource?.credentials as unknown as BigQueryCredentials;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      service_account_key: credentials?.service_account_key || '',
      project_id: credentials?.project_id || '',
      default_dataset: credentials?.default_dataset || '',
      type: 'bigquery' as const,
      name: dataSource?.name || '',
    } as BigQueryCredentials & { name: string },
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
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My BigQuery" />
        )}
      </form.AppField>

      <form.AppField name="service_account_key">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Service Account Key JSON"
            placeholder="Paste your service account key JSON here"
          />
        )}
      </form.AppField>

      <form.AppField name="project_id">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Project ID"
            placeholder="your-project-id"
          />
        )}
      </form.AppField>

      <form.AppField name="default_dataset">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Dataset ID"
            placeholder="your_dataset"
          />
        )}
      </form.AppField>
    </FormWrapper>
  );
};
