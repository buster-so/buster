import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MySqlForm } from './MySqlForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'mysql-123',
  name: 'Sample MySQL DB',
  type: 'mysql',
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
    type: 'mysql',
    host: 'mysql.example.com',
    port: 3306,
    username: 'root',
    password: 'Password123',
    default_database: 'myapp',
  },
  datasets: [],
};

const meta: Meta<typeof MySqlForm> = {
  title: 'Forms/Datasources/MySqlForm',
  component: MySqlForm,
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
type Story = StoryObj<typeof MySqlForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};
