import {
  DatabricksCreateCredentials,
  DatasourceCreateCredentials,
  PostgresCreateCredentials
} from '@/api/buster-socket/datasources/interface';
import { DataSource } from '@/api/buster-rest';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import { Form, Input } from 'antd';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';

export const DataBricksForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
  submitting: boolean;
  onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
}> = ({ useConnection, dataSource, submitting, onSubmit }) => {
  return (
    <FormWrapper
      name="mysql"
      useConnection={useConnection}
      submitting={submitting}
      dataSource={dataSource}
      onSubmit={(v) => {
        onSubmit(v as DatabricksCreateCredentials);
      }}>
      <Form.Item name="host" label="Hostname" rules={[{ required: true }]}>
        <Input placeholder="Hostname" />
      </Form.Item>
      <Form.Item name="api_key" label="API Key" rules={[{ required: true }]}>
        <Input.Password placeholder="API Key" />
      </Form.Item>

      <Form.Item name="warehouse_id" label="Warehouse ID" rules={[{ required: true }]}>
        <Input placeholder="Warehouse ID" />
      </Form.Item>

      <Form.Item name="catalog_name" label="Catalog Name" rules={[{ required: true }]}>
        <Input placeholder="Catalog Name" />
      </Form.Item>

      <Form.Item name="schemas" label="Schemas" rules={[{ required: true }]}>
        <AppSelectTagInput
          className="w-full"
          tokenSeparators={[',']}
          suffixIcon={null}
          placeholder="Schemas"
        />
      </Form.Item>
    </FormWrapper>
  );
};
