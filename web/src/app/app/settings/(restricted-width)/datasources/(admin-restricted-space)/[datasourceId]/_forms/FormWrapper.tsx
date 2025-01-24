import { useMemoizedFn } from 'ahooks';
import { Button, Form, FormInstance, Input } from 'antd';
import { createStyles } from 'antd-style';
import React, { useImperativeHandle, useLayoutEffect } from 'react';
import { WhiteListBlock } from '../WhiteListBlock';
import { DatasourceCreateCredentials } from '@/api/buster_socket/datasources/interface';
import { DataSource } from '@/api/buster_rest';
import { NewDatasetModal } from '@appComponents/NewDatasetModal';

const layout = {
  labelCol: { span: 7, offset: 0 },
  wrapperCol: { span: 16, offset: 1 }
};

const useStyles = createStyles(({ css, token }) => ({
  form: css`
    background: ${token.colorBgBase};
    border-radius: 0 0 ${token.borderRadius}px ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};

    .busterv2-row {
      padding-top: 16px;
      padding-bottom: 16px;
    }

    .busterv2-row,
    .busterv2-form-item {
      align-items: center;
    }

    .busterv2-form-item {
      &:not(:last-child) {
        border-bottom: 1px solid ${token.colorBorder};
      }
    }

    .busterv2-col-16 {
      margin-right: 16px;
    }

    .busterv2-col {
      label {
        margin-left: 16px;
      }

      .busterv2-row {
        padding: 0 !important;
      }
      .busterv2-form-item {
        border-bottom: none;
      }
    }
  `
}));

export interface FormWrapperHandle {
  form: FormInstance;
}

export const FormWrapper = React.forwardRef<
  FormWrapperHandle,
  {
    children: React.ReactNode;
    name: string;
    useConnection: boolean;
    submitting: boolean;
    dataSource?: DataSource;
    onSubmit: (v: DatasourceCreateCredentials) => void;
  }
>(({ children, dataSource, name, useConnection, onSubmit, submitting }, ref) => {
  const { styles, cx } = useStyles();
  const [form] = Form.useForm();
  const datasourceId = dataSource?.id;

  const onSubmitPreflight = useMemoizedFn(async () => {
    const values = await form.validateFields();
    onSubmit(values);
  });

  useImperativeHandle(ref, () => ({
    form
  }));

  useLayoutEffect(() => {
    if (dataSource) {
      form?.setFieldsValue({
        ...dataSource.credentials,
        hostname: dataSource.credentials.host,
        database_name: dataSource.credentials.database,
        datasource_name: dataSource.name
      });
    }
  }, [dataSource?.id, form]);

  return (
    <div className="flex flex-col space-y-4">
      <Form
        name={name}
        autoComplete="off"
        className={cx(styles.form, 'gap-2 space-y-0')}
        form={form}
        labelAlign="left"
        labelWrap={true}
        requiredMark={false}
        colon={false}
        {...layout}>
        <Form.Item name="datasource_name" label="Datasource name" rules={[{ required: true }]}>
          <Input placeholder="Datasource name" />
        </Form.Item>

        {children}
      </Form>

      <WhiteListBlock />

      <Form.Item wrapperCol={{ offset: 0 }} style={{ textAlign: 'right' }}>
        <SubmitButtons
          form={form}
          submitting={submitting}
          useConnection={useConnection}
          onSubmit={onSubmitPreflight}
          datasourceId={datasourceId}
        />
      </Form.Item>
    </div>
  );
});
FormWrapper.displayName = 'FormWrapper';

const SubmitButtons: React.FC<{
  form: FormInstance;
  onSubmit: () => void;
  useConnection: boolean;
  submitting: boolean;
  datasourceId?: string;
}> = ({ form, onSubmit, useConnection, submitting, datasourceId }) => {
  const [submittable, setSubmittable] = React.useState<boolean>(false);
  const [openDatasetModal, setOpenDatasetModal] = React.useState<boolean>(false);

  // Watch all values
  const values = Form.useWatch([], form);

  React.useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  return (
    <>
      <div className="flex justify-end space-x-2">
        {!useConnection && (
          <Button
            type="default"
            onClick={() => {
              setOpenDatasetModal(true);
            }}>
            Create a Dataset
          </Button>
        )}
        <Button
          type="primary"
          htmlType="submit"
          disabled={!submittable}
          loading={submitting}
          onClick={onSubmit}>
          {!useConnection ? 'Update' : 'Connect'}
        </Button>
      </div>

      {!useConnection && (
        <NewDatasetModal
          open={openDatasetModal}
          onClose={() => setOpenDatasetModal(false)}
          datasourceId={datasourceId}
        />
      )}
    </>
  );
};
