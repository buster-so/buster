import type { Meta, StoryObj } from '@storybook/react';
import { AppVerticalCodeSplitter } from './AppVerticalCodeSplitter';

const meta: Meta<typeof AppVerticalCodeSplitter> = {
  title: 'Features/Layout/AppVerticalCodeSplitter',
  component: AppVerticalCodeSplitter,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  args: {
    className: 'min-h-[600px] min-w-[600px]'
  },
  decorators: [
    (Story) => (
      <div className="" style={{ height: '500px' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AppVerticalCodeSplitter>;

const mockData: Record<string, string | number | null>[] = [
  { id: 1, name: 'Sample Data 1' },
  { id: 2, name: 'Sample Data 2' }
];

export const Default: Story = {
  args: {
    sql: 'SELECT * FROM sample_table',
    setSQL: (sql: string) => alert('SQL changed: ' + sql),
    runSQLError: '',
    onRunQuery: async () => alert('Running query...'),
    data: mockData,
    fetchingData: false,
    defaultLayout: ['50%', '50%'],
    autoSaveId: 'default-split-for-code-splitter'
  }
};

export const WithError: Story = {
  args: {
    ...Default.args,
    runSQLError: 'Invalid SQL syntax'
  }
};

export const Loading: Story = {
  args: {
    ...Default.args,
    fetchingData: true
  }
};

export const TopHidden: Story = {
  args: {
    ...Default.args,
    topHidden: true
  }
};

export const CustomGap: Story = {
  args: {
    ...Default.args,
    gapAmount: 6
  }
};

export const WithSaveButton: Story = {
  args: {
    ...Default.args,
    onSaveSQL: async () => alert('Saving SQL...')
  }
};

export const DisabledSave: Story = {
  args: {
    ...Default.args,
    onSaveSQL: async () => alert('Saving SQL...'),
    disabledSave: true
  }
};
