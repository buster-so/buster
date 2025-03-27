import type { Meta, StoryObj } from '@storybook/react';
import { BigQueryForm } from './BigQueryForm';
import { DataSource, DataSourceTypes } from '@/api/asset_interfaces';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'bigquery-123',
  name: 'Sample BigQuery DB',
  type: DataSourceTypes.bigquery,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    type: 'bigquery',
    service_role_key: '{\"type\":\"service_account\",\"project_id\":\"example-project\"}',
    default_project_id: 'example-project',
    default_dataset_id: 'example_dataset'
  },
  data_sets: []
};

const meta: Meta<typeof BigQueryForm> = {
  title: 'Forms/Datasources/BigQueryForm',
  component: BigQueryForm,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[600px] rounded-md bg-white p-4 shadow-sm">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof BigQueryForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
