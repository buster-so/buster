import type { Meta, StoryObj } from '@storybook/react';
import { PostgresForm } from './PostgresForm';
import { fn } from '@storybook/test';
import { DataSource, DataSourceTypes, PostgresCredentials } from '@/api/asset_interfaces';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'postgres-123',
  name: 'Sample Postgres DB',
  type: DataSourceTypes.postgres,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password123',
    default_database: 'postgres',
    default_schema: 'public',
    type: 'postgres'
  },
  data_sets: []
};

const meta: Meta<typeof PostgresForm> = {
  title: 'Forms/Datasources/PostgresForm',
  component: PostgresForm,
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
type Story = StoryObj<typeof PostgresForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
