import type { Meta, StoryObj } from '@storybook/react';
import { SqlServerForm } from './SqlServerForm';
import { DataSource, DataSourceTypes } from '@/api/asset_interfaces';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'sqlserver-123',
  name: 'Sample SQL Server DB',
  type: DataSourceTypes.sqlserver,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    type: 'sqlserver',
    host: 'sqlserver.example.com',
    port: 1433,
    username: 'sa',
    password: 'Password123',
    default_database: 'AdventureWorks',
    default_schema: 'dbo'
  },
  data_sets: []
};

const meta: Meta<typeof SqlServerForm> = {
  title: 'Forms/Datasources/SqlServerForm',
  component: SqlServerForm,
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
type Story = StoryObj<typeof SqlServerForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
