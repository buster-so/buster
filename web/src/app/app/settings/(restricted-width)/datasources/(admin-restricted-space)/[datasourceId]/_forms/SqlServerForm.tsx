import {
  DatasourceCreateCredentials,
  SqlServerCreateCredentials
} from '@/api/buster_socket/datasources/interface';
import { DataSource } from '@/api/buster_rest';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import { Form, Input, InputNumber } from 'antd';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';

export const SqlServerForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
  submitting: boolean;
  onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
}> = ({ dataSource, useConnection, submitting, onSubmit }) => {
  return (
    <FormWrapper
      name="mysql"
      useConnection={useConnection}
      submitting={submitting}
      dataSource={dataSource}
      onSubmit={(v) => {
        onSubmit(v as SqlServerCreateCredentials);
      }}>
      <Form.Item label="Hostname & port">
        <Form.Item
          name="host"
          rules={[{ required: true }]}
          style={{ display: 'inline-block', width: 'calc(75% - 8px)' }}>
          <Input placeholder="Hostname" />
        </Form.Item>
        <Form.Item
          name="port"
          rules={[{ required: true }]}
          initialValue={1433}
          style={{ display: 'inline-block', width: 'calc(25% - 0px)', marginLeft: '8px' }}>
          <InputNumber placeholder="Port" />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Username & password">
        <Form.Item
          name="username"
          rules={[{ required: true }]}
          style={{ display: 'inline-block', width: 'calc(50% - 0px)' }}>
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true }]}
          style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '8px' }}>
          <Input.Password placeholder="Password" />
        </Form.Item>
      </Form.Item>

      {/* <Form.Item name="jump_host" label="Jump host" rules={[{ required: false }]}>
        <Input placeholder="Jump host" />
      </Form.Item> */}

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
