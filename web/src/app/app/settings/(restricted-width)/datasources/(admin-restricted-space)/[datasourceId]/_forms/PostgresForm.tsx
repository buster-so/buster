import { DataSource } from '@/api/buster_rest';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { useKeyPress } from 'ahooks';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';
import { FormWrapper, FormWrapperHandle } from './FormWrapper';
import { formatDate } from '@/utils';
import {
  DatasourceCreateCredentials,
  PostgresCreateCredentials
} from '@/api/buster_socket/datasources/interface';

const sshModeOptions = ['Do not use SSH credentials', 'Use SSH credentials'].map((item, index) => ({
  label: item,
  value: index
}));

export const PostgresForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
  submitting: boolean;
  onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
}> = ({ dataSource, useConnection = false, submitting, onSubmit }) => {
  const formRef = useRef<FormWrapperHandle>(null);
  useKeyPress(['meta.shift.b', 'shift.ctrl.b'], () => {
    const form = formRef.current?.form;
    if (!form) return;
    form.setFieldsValue({
      schemas: ['public'],
      port: 5432,
      host: process.env.NEXT_PUBLIC_POSTGRES_DEFAULT_DB_HOST!,
      username: process.env.NEXT_PUBLIC_POSTGRES_DEFAULT_DB_USERNAME!,
      password: process.env.NEXT_PUBLIC_POSTGRES_DEFAULT_DB_PASSWORD!,
      database: 'postgres',
      datasource_name: formatDate({
        date: new Date(),
        format: 'MMM DD, YYYY HH:mm:ss',
        isUTC: false
      })
    });
  });

  return (
    <FormWrapper
      name="postgres"
      ref={formRef}
      useConnection={useConnection}
      dataSource={dataSource}
      submitting={submitting}
      onSubmit={(v) => {
        onSubmit(v as PostgresCreateCredentials);
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
          initialValue={5432}
          style={{ display: 'inline-block', width: 'calc(25% - 0px)', marginLeft: '8px' }}>
          <InputNumber placeholder="5432" />
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

      <Form.Item name="database" label="Database name" rules={[{ required: true }]}>
        <Input placeholder="Database name" />
      </Form.Item>

      <Form.Item name="schemas" label="Schemas" rules={[{ required: true }]}>
        <AppSelectTagInput
          className="w-full"
          tokenSeparators={[',']}
          suffixIcon={null}
          placeholder="Schemas"
        />
      </Form.Item>

      <Form.Item name="ssh" label="SSH" initialValue={sshModeOptions[0].value}>
        <Select className="w-full" defaultActiveFirstOption options={sshModeOptions} />
      </Form.Item>
    </FormWrapper>
  );
};
