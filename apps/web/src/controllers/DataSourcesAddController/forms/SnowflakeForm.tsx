import type { GetDataSourceResponse } from '@buster/server-shared';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { SnowflakeCredentials } from '@/api/asset_interfaces/datasources';
import {
  type createSnowflakeDataSource,
  useCreateSnowflakeDataSource,
  useUpdateSnowflakeDataSource,
} from '@/api/buster_rest/data_source';
import { Button } from '@/components/ui/buttons/Button';
import { LabelWrapper, MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { Select } from '@/components/ui/select/Select';
import { Text } from '@/components/ui/typography';
import { FormWrapper } from './FormWrapper';
import { useDataSourceFormSuccess } from './helpers';

export const SnowflakeForm: React.FC<{
  dataSource?: GetDataSourceResponse;
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
      warehouse_id: credentials?.warehouse_id || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      role: credentials?.role || '',
      type: 'snowflake' as const,
      name: dataSource?.name || '',
      auth_method: credentials?.auth_method || ('password' as const),
      password: credentials?.auth_method === 'password' ? credentials.password : '',
      private_key: credentials?.auth_method === 'key_pair' ? credentials.private_key : '',
      private_key_passphrase:
        credentials?.auth_method === 'key_pair' ? credentials.private_key_passphrase || '' : '',
    } as SnowflakeCredentials & { name: string },
    onSubmit: async ({ value }) => {
      // Filter payload based on auth_method to only include relevant fields
      const {
        auth_method,
        account_id,
        username,
        warehouse_id,
        default_database,
        default_schema,
        role,
        custom_host,
        type,
        name,
      } = value;

      let filteredValue: SnowflakeCredentials & { name: string };

      if (auth_method === 'key_pair') {
        // Type narrow to key_pair variant and extract only those fields
        const typedValue = value as Extract<typeof value, { auth_method: 'key_pair' }>;
        filteredValue = {
          type,
          name,
          account_id,
          username,
          warehouse_id,
          default_database,
          default_schema,
          role,
          custom_host,
          auth_method,
          private_key: typedValue.private_key,
          private_key_passphrase: typedValue.private_key_passphrase,
        } as SnowflakeCredentials & { name: string };
      } else {
        // Type narrow to password variant and extract only that field
        const typedValue = value as Extract<typeof value, { auth_method: 'password' }>;
        filteredValue = {
          type,
          name,
          account_id,
          username,
          warehouse_id,
          default_database,
          default_schema,
          role,
          custom_host,
          auth_method,
          password: typedValue.password,
        } as SnowflakeCredentials & { name: string };
      }

      await dataSourceFormSubmit({
        flow,
        dataSourceId: dataSource?.id,
        onUpdate: () => updateDataSource({ id: dataSource?.id || '', ...filteredValue }),
        onCreate: () => createDataSource(filteredValue),
      });
    },
  });

  const labelClassName = 'min-w-[175px]';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Clear authentication fields when switching between auth methods
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const authMethod = form.getFieldValue('auth_method');

      // When switching to key_pair, clear password
      if (authMethod === 'key_pair') {
        const currentPassword = form.getFieldValue('password');
        if (currentPassword) {
          form.setFieldValue('password', '');
        }
      }

      // When switching to password, clear private_key and passphrase
      if (authMethod === 'password') {
        const currentPrivateKey = form.getFieldValue('private_key');
        const currentPassphrase = form.getFieldValue('private_key_passphrase');
        if (currentPrivateKey) {
          form.setFieldValue('private_key', '');
          setUploadedFileName('');
        }
        if (currentPassphrase) {
          form.setFieldValue('private_key_passphrase', '');
        }
      }
    });

    return () => subscription();
  }, [form]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      form.setFieldValue('private_key', content);
      setUploadedFileName(file.name);
    } catch (error) {
      console.error('Failed to read private key file:', error);
    }
  };

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

      <form.AppField name="auth_method">
        {(field) => (
          <LabelWrapper
            label="Authentication Method"
            labelClassName={labelClassName}
            htmlFor={field.name}
          >
            <Select
              value={field.state.value}
              onChange={(value) => field.handleChange(value as 'password' | 'key_pair')}
              items={[
                { value: 'key_pair', label: 'Key Pair' },
                { value: 'password', label: 'Username & Password' },
              ]}
              placeholder="Select authentication method"
            />
          </LabelWrapper>
        )}
      </form.AppField>

      <form.AppField name="username">
        {(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Username"
            placeholder="username"
          />
        )}
      </form.AppField>

      <form.Subscribe selector={(state) => state.values.auth_method}>
        {(authMethod) => (
          <>
            {authMethod === 'password' && (
              <form.AppField name="password">
                {(field) => (
                  <field.PasswordField
                    labelClassName={labelClassName}
                    label="Password"
                    placeholder="password"
                  />
                )}
              </form.AppField>
            )}

            {authMethod === 'key_pair' && (
              <>
                <form.AppField name="private_key">
                  {(field) => (
                    <LabelWrapper
                      label="Private Key"
                      labelClassName={labelClassName}
                      htmlFor={field.name}
                    >
                      <div className="flex w-full flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pem,.p8,.key"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Upload private key file (.pem, .p8)
                        </Button>
                        {uploadedFileName && (
                          <Text size="sm" variant="secondary">
                            Uploaded: {uploadedFileName}
                          </Text>
                        )}
                        {!uploadedFileName && field.state.value && (
                          <Text size="sm" variant="secondary">
                            Private key loaded
                          </Text>
                        )}
                      </div>
                    </LabelWrapper>
                  )}
                </form.AppField>

                <form.AppField name="private_key_passphrase">
                  {(field) => (
                    <field.PasswordField
                      labelClassName={labelClassName}
                      label="Passphrase (Optional)"
                      placeholder="Enter passphrase if key is encrypted"
                    />
                  )}
                </form.AppField>
              </>
            )}
          </>
        )}
      </form.Subscribe>

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
