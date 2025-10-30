import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RedshiftForm } from './RedshiftForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'redshift-123',
  name: 'Sample Redshift DB',
  type: 'redshift',
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
    type: 'redshift',
    host: 'my-cluster.abc123xyz456.us-west-2.redshift.amazonaws.com',
    port: 5439,
    username: 'awsuser',
    password: 'Password123',
    default_database: 'dev',
    default_schema: 'public',
  },
  datasets: [],
};

const meta: Meta<typeof RedshiftForm> = {
  title: 'Forms/Datasources/RedshiftForm',
  component: RedshiftForm,
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
type Story = StoryObj<typeof RedshiftForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};
