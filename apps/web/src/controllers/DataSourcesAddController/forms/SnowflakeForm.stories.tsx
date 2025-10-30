import type { GetDataSourceResponse } from '@buster/server-shared';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SnowflakeForm } from './SnowflakeForm';

// Sample DataSource for the story
const sampleDataSource: GetDataSourceResponse = {
  id: 'snowflake-123',
  name: 'Sample Snowflake DB',
  type: 'snowflake',
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
    type: 'snowflake',
    auth_method: 'password',
    account_id: 'XYZ12345',
    warehouse_id: 'COMPUTE_WH',
    username: 'SNOWUSER',
    password: 'SnowPassword123',
    role: 'ACCOUNTADMIN',
    default_database: 'SNOWFLAKE_SAMPLE_DATA',
    default_schema: 'PUBLIC',
  },
  datasets: [],
};

const meta: Meta<typeof SnowflakeForm> = {
  title: 'Forms/Datasources/SnowflakeForm',
  component: SnowflakeForm,
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
type Story = StoryObj<typeof SnowflakeForm>;

export const NewDataSource: Story = {
  args: {},
};

export const ExistingDataSource: Story = {
  args: {
    dataSource: sampleDataSource,
  },
};

// Sample DataSource with Key Pair authentication
const keyPairDataSource: GetDataSourceResponse = {
  ...sampleDataSource,
  credentials: {
    type: 'snowflake',
    auth_method: 'key_pair',
    account_id: 'XYZ12345',
    warehouse_id: 'COMPUTE_WH',
    username: 'SNOWUSER',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
    private_key_passphrase: '',
    role: 'ACCOUNTADMIN',
    default_database: 'SNOWFLAKE_SAMPLE_DATA',
    default_schema: 'PUBLIC',
  },
};

export const ExistingDataSourceWithKeyPair: Story = {
  args: {
    dataSource: keyPairDataSource,
  },
};
