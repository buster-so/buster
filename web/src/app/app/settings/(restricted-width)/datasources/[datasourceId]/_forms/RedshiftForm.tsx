import {
  DatasourceCreateCredentials,
  MySqlCreateCredentials,
  PostgresCreateCredentials,
  RedshiftCreateCredentials
} from '@/api/buster-socket/datasources/interface';
import { DataSource } from '@/api/buster-rest';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';
import { Form, Input, InputNumber } from 'antd';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { FormWrapper, FormWrapperHandle } from './FormWrapper';

export const RedshiftForm: React.FC<{
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
        onSubmit(v as RedshiftCreateCredentials);
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
          initialValue={5439}
          style={{ display: 'inline-block', width: 'calc(25% - 0px)', marginLeft: '8px' }}>
          <InputNumber placeholder="5439" />
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

      <Form.Item name="database" label="Database" rules={[{ required: true }]}>
        <Input placeholder="Database" />
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
