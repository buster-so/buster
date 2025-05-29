import { type DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import type { Meta, StoryObj } from '@storybook/react';
import { RedshiftForm } from './RedshiftForm';

// Sample DataSource for the story
const sampleDataSource: DataSource = {
  id: 'redshift-123',
  name: 'Sample Redshift DB',
  type: DataSourceTypes.redshift,
  created_at: '2024-07-18T21:19:49.721159Z',
  updated_at: '2024-07-18T21:19:49.721160Z',
  created_by: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  credentials: {
    type: 'redshift',
    host: 'my-cluster.abc123xyz456.us-west-2.redshift.amazonaws.com',
    port: 5439,
    username: 'awsuser',
    password: 'Password123',
    default_database: 'dev',
    default_schema: 'public'
  },
  data_sets: []
};

const meta: Meta<typeof RedshiftForm> = {
  title: 'Forms/Datasources/RedshiftForm',
  component: RedshiftForm,
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
type Story = StoryObj<typeof RedshiftForm>;

export const NewDataSource: Story = {
  args: {}
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource
  }
};
