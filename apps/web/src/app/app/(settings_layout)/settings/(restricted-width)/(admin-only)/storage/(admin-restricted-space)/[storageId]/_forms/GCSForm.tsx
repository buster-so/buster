import type React from 'react';
import { GCSIntegrationSchema } from '@buster/server-shared/s3-integrations';
import { useCreateS3Integration } from '@/api/buster_rest/s3-integrations';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { StorageFormWrapper } from './StorageFormWrapper';
import { useStorageFormSuccess } from './helpers';

export const GCSForm: React.FC = () => {
  const { mutateAsync: createS3Integration } = useCreateS3Integration();
  const storageFormSubmit = useStorageFormSuccess();

  const form = useAppForm({
    defaultValues: {
      provider: 'gcs' as const,
      bucket: '',
      projectId: '',
      serviceAccountKey: ''
    },
    onSubmit: async ({ value }) => {
      await storageFormSubmit({
        onCreate: () => createS3Integration(value)
      });
    },
    validators: {
      onSubmit: GCSIntegrationSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <StorageFormWrapper form={form}>
      <form.AppField name="bucket">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Bucket Name"
            placeholder="my-gcs-bucket"
          />
        )}
      </form.AppField>

      <form.AppField name="projectId">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Project ID"
            placeholder="my-project-123456"
          />
        )}
      </form.AppField>

      <form.AppField name="serviceAccountKey">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Service Account Key"
            placeholder='{"type": "service_account", "project_id": "...", ...}'
          />
        )}
      </form.AppField>
    </StorageFormWrapper>
  );
};
