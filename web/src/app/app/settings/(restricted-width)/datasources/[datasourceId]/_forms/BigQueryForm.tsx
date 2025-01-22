import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FormWrapper, FormWrapperHandle } from './FormWrapper';
import { DataSource } from '@/api/buster_rest';
import {
  BigQueryCreateCredentials,
  DatasourceCreateCredentials
} from '@/api/buster_socket/datasources/interface';
import { Form, Input } from 'antd';
import { AppTooltip } from '@/components';
import { AppCodeEditor } from '@/components/inputs/AppCodeEditor';
import { useAntToken } from '@/styles/useAntToken';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';
import { useBusterNotifications } from '@/context/BusterNotifications';

type RawBigQueryCreateCredentials = Omit<BigQueryCreateCredentials, 'credentials_json'> & {
  credentials_json: string;
};

export const BigQueryForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
  submitting: boolean;
  onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
}> = ({ dataSource, useConnection, submitting, onSubmit }) => {
  const token = useAntToken();
  const formRef = useRef<FormWrapperHandle>(null);
  const [creds, setCreds] = useState('');
  const { openErrorNotification } = useBusterNotifications();

  const isValidJson = useMemo(() => {
    if (!creds) return true;
    try {
      JSON.parse(creds);
      return true;
    } catch (error) {
      return false;
    }
  }, [creds]);

  return (
    <FormWrapper
      name="bigquery"
      ref={formRef}
      useConnection={useConnection}
      dataSource={dataSource}
      submitting={submitting}
      onSubmit={(v) => {
        const value = v as unknown as RawBigQueryCreateCredentials;
        if (!creds) {
          openErrorNotification('Credentials are required');
          return;
        }
        try {
          const parsedCredentials = JSON.parse(creds);
          onSubmit({ ...value, credentials_json: parsedCredentials });
        } catch (error) {
          openErrorNotification('Invalid credentials JSON');
        }
      }}>
      <Form.Item name="project_id" label="Project ID" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="dataset_ids" label="Dataset IDs" rules={[{ required: true }]}>
        <AppSelectTagInput className="w-full" tokenSeparators={[',']} suffixIcon={null} />
      </Form.Item>
      <Form.Item name="credentials_json" label="Credentials">
        <AppTooltip title={isValidJson ? '' : 'Invalid JSON'} forceShow>
          <div
            className="h-[180px] w-full"
            style={{
              border: isValidJson ? `1px solid ${token.colorBorder}` : '1px solid red',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
            <AppCodeEditor language="json" value={creds} onChange={setCreds} />
          </div>
        </AppTooltip>
      </Form.Item>
    </FormWrapper>
  );
};
