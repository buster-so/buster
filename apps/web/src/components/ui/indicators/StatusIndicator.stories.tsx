import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from './StatusIndicator';

const meta = {
  title: 'UI/Icons/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    status: 'loading'
  }
};

export const Completed: Story = {
  args: {
    status: 'completed'
  }
};

export const Failed: Story = {
  args: {
    status: 'failed'
  }
};

// Story that shows all states side by side
export const AllStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="loading" />
        <span className="text-sm">Loading</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="completed" />
        <span className="text-sm">Completed</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="failed" />
        <span className="text-sm">Failed</span>
      </div>
    </div>
  )
};
