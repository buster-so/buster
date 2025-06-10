import type { Meta, StoryObj } from '@storybook/react';
import { StreamingMessageStatus } from './StreamingMessageStatus';

const meta: Meta<typeof StreamingMessageStatus> = {
  title: 'Components/StreamingMessageStatus',
  component: StreamingMessageStatus,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-background p-4">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof StreamingMessageStatus>;

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
