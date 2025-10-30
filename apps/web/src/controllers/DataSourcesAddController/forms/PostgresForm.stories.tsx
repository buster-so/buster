import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PostgresForm } from './PostgresForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'postgres-123',
  name: 'Sample Postgres DB',
  type: 'postgres',
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
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password123',
    default_database: 'postgres',
    default_schema: 'public',
    type: 'postgres',
  },
  datasets: [],
};

const meta: Meta<typeof PostgresForm> = {
  title: 'Forms/Datasources/PostgresForm',
  component: PostgresForm,
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
type Story = StoryObj<typeof PostgresForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};
