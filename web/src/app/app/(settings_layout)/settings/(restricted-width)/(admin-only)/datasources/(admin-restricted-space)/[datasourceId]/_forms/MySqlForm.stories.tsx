import { type DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import type { Meta, StoryObj } from '@storybook/react';
import { MySqlForm } from './MySqlForm';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'mysql-123',
  name: 'Sample MySQL DB',
  type: DataSourceTypes.mysql,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    name: 'Sample MySQL DB',
    type: 'mysql',
    host: 'mysql.example.com',
    port: 3306,
    username: 'root',
    // Additional properties needed by the form but not in the interface
    password: 'Password123',
    default_database: 'myapp'
  } as any,
  data_sets: []
};

const meta: Meta<typeof MySqlForm> = {
  title: 'Forms/Datasources/MySqlForm',
  component: MySqlForm,
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
type Story = StoryObj<typeof MySqlForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
