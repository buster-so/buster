import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { FormWrapper, FormWrapperHandle } from './FormWrapper';
import {
  DatasourceCreateCredentials,
  MySqlCreateCredentials
} from '@/api/buster-socket/datasources/interface';
import { DataSource } from '@/api/buster-rest';
import { AppSelectTagInput } from '@/components/select/AppSelectTagInput';
import { Form, Input } from 'antd';
import { RuleObject } from 'antd/es/form';
import { makeHumanReadble } from '@/utils';

export const SnowflakeForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
  submitting: boolean;
  onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
}> = ({ dataSource, useConnection, submitting, onSubmit }) => {
  const uppercaseValidator = (f: RuleObject, value: string) => {
    if (!value) return Promise.reject();
    // @ts-ignore
    const field = makeHumanReadble(f.field);
    if (value !== value.toUpperCase()) return Promise.reject(`${field} must be uppercase`);
    return Promise.resolve();
  };

  return (
    <FormWrapper
      name="mysql"
      useConnection={useConnection}
      submitting={submitting}
      dataSource={dataSource}
      onSubmit={(v) => {
        onSubmit(v as MySqlCreateCredentials);
      }}>
      <Form.Item
        name="account_id"
        label="Account ID"
        rules={[{ required: true }, { validator: uppercaseValidator }]}>
        <Input placeholder="Account ID" />
      </Form.Item>

      <Form.Item
        name="warehouse_id"
        label="Warehouse ID"
        rules={[{ required: true }, { validator: uppercaseValidator }]}>
        <Input placeholder="Warehouse ID" />
      </Form.Item>

      <Form.Item
        name="database_id"
        label="Database ID"
        rules={[{ required: true }, { validator: uppercaseValidator }]}>
        <Input placeholder="Database ID" />
      </Form.Item>

      <Form.Item label="Username & password">
        <Form.Item
          name="username"
          rules={[{ required: true }, { validator: uppercaseValidator }]}
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

      <Form.Item
        name="schemas"
        label="Schemas"
        rules={[
          { required: true },
          {
            validator: (_, v) => {
              const arrayOfValues = v as string[];
              if (!v || arrayOfValues.length === 0) return Promise.reject('Schemas is required');
              const allStringAreUppercase = arrayOfValues.every(
                (value) => value === value.toUpperCase()
              );
              if (!allStringAreUppercase) return Promise.reject('Schemas must be uppercase');
              return Promise.resolve();
            }
          }
        ]}>
        <AppSelectTagInput
          className="w-full"
          tokenSeparators={[',']}
          suffixIcon={null}
          placeholder="Schemas"
        />
      </Form.Item>

      <Form.Item
        name="role"
        label="Role (optional)"
        rules={[
          { required: false },
          {
            validator: (_, v) => {
              const value = v as string;
              if (!value) return Promise.resolve();
              if (value !== value.toUpperCase()) return Promise.reject('Role must be uppercase');
              return Promise.resolve();
            }
          }
        ]}>
        <Input placeholder="Role" />
      </Form.Item>
    </FormWrapper>
  );
};
