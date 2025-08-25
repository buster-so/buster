import type React from 'react';
import { S3IntegrationSchema } from '@buster/server-shared/s3-integrations';
import { useCreateS3Integration } from '@/api/buster_rest/s3-integrations';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { StorageFormWrapper } from './StorageFormWrapper';
import { useStorageFormSuccess } from './helpers';

export const S3Form: React.FC = () => {
  const { mutateAsync: createS3Integration } = useCreateS3Integration();
  const storageFormSubmit = useStorageFormSuccess();

  const form = useAppForm({
    defaultValues: {
      provider: 's3' as const,
      bucket: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: ''
    },
    onSubmit: async ({ value }) => {
      await storageFormSubmit({
        onCreate: () => createS3Integration(value)
      });
    },
    validators: {
      onSubmit: S3IntegrationSchema
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
            placeholder="my-bucket"
          />
        )}
      </form.AppField>

      <form.AppField name="region">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="AWS Region"
            placeholder="us-east-1"
          />
        )}
      </form.AppField>

      <MultipleInlineFields label="AWS Credentials" labelClassName={labelClassName}>
        <form.AppField name="accessKeyId">
          {(field) => <field.TextField label={null} placeholder="Access Key ID" />}
        </form.AppField>
        <form.AppField name="secretAccessKey">
          {(field) => <field.PasswordField label={null} placeholder="Secret Access Key" />}
        </form.AppField>
      </MultipleInlineFields>
    </StorageFormWrapper>
  );
};
