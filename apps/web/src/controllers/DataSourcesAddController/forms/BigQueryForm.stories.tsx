import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BigQueryForm } from './BigQueryForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'bigquery-123',
  name: 'Sample BigQuery DB',
  type: 'bigquery',
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
    type: 'bigquery',
    project_id: 'example-project',
    service_account_key: '{"type":"service_account","project_id":"example-project"}',
    default_dataset: 'example_dataset',
  },
  datasets: [],
};

const meta: Meta<typeof BigQueryForm> = {
  title: 'Forms/Datasources/BigQueryForm',
  component: BigQueryForm,
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
type Story = StoryObj<typeof BigQueryForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};
