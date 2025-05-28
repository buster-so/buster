import type { Meta, StoryObj } from '@storybook/react';
import { DataBricksForm } from './DataBricksForm';
import { type DataSource, DataSourceTypes } from '@/api/asset_interfaces';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'databricks-123',
  name: 'Sample Databricks DB',
  type: DataSourceTypes.databricks,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    type: 'databricks',
    host: 'https://demo.cloud.databricks.com',
    api_key: 'dapi1234567890abcdef',
    warehouse_id: 'warehouse123',
    default_catalog: 'hive_metastore',
    default_schema: 'default'
  },
  data_sets: []
};

const meta: Meta<typeof DataBricksForm> = {
  title: 'Forms/Datasources/DataBricksForm',
  component: DataBricksForm,
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
type Story = StoryObj<typeof DataBricksForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
