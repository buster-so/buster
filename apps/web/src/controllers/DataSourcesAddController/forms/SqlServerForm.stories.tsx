import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SqlServerForm } from './SqlServerForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'sqlserver-123',
  name: 'Sample SQL Server DB',
  type: 'sqlserver',
  organizationId: 'org-123',
  createdAt: '2024-07-18T21:19:49.721159Z',
  updatedAt: '2024-07-18T21:19:49.721160Z',
  deletedAt: null,
  onboardingStatus: 'completed',
  onboardingError: null,
  createdBy: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  },
  credentials: {
    type: 'sqlserver',
    host: 'sqlserver.example.com',
    port: 1433,
    username: 'sa',
    password: 'Password123',
    default_database: 'AdventureWorks',
  },
  datasets: [],
};

const meta: Meta<typeof SqlServerForm> = {
  title: 'Forms/Datasources/SqlServerForm',
  component: SqlServerForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-w-[600px] rounded-md bg-white p-4 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SqlServerForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};
