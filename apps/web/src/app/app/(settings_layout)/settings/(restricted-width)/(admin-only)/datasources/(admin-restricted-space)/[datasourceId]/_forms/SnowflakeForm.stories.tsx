import type { Meta, StoryObj } from '@storybook/react';
import { type DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import { SnowflakeForm } from './SnowflakeForm';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'snowflake-123',
  name: 'Sample Snowflake DB',
  type: DataSourceTypes.snowflake,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    type: 'snowflake',
    account_id: 'XYZ12345',
    warehouse_id: 'COMPUTE_WH',
    username: 'SNOWUSER',
    password: 'SnowPassword123',
    role: 'ACCOUNTADMIN',
    default_database: 'SNOWFLAKE_SAMPLE_DATA',
    default_schema: 'PUBLIC'
  },
  data_sets: []
};

const meta: Meta<typeof SnowflakeForm> = {
  title: 'Forms/Datasources/SnowflakeForm',
  component: SnowflakeForm,
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
type Story = StoryObj<typeof SnowflakeForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
