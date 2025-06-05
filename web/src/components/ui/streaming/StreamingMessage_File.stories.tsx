import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { StreamingMessage_File } from './StreamingMessage_File';

const meta: Meta<typeof StreamingMessage_File> = {
  title: 'UI/Streaming/StreamingMessage_File',
  component: StreamingMessage_File,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="w-full min-w-[300px]">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StreamingMessage_File>;

const mockResponseMessage: BusterChatResponseMessage_file = {
  id: '1',
  type: 'file',
  file_type: 'metric',
  file_name: 'example.txt',
  version_number: 1,
  filter_version_id: null,
  metadata: [
    {
      status: 'completed',
      message: 'File processed successfully',
      timestamp: 2.5
    },
    {
      status: 'loading',
      message: 'Analyzing file contents with a really long message that should truncate in the ui',
      timestamp: 1.2
    }
  ]
};

export const Default: Story = {
  args: {
    isSelectedFile: false,
    isCompletedStream: true,
    responseMessage: mockResponseMessage
  }
};

export const Selected: Story = {
  args: {
    isSelectedFile: true,
    isCompletedStream: true,
    responseMessage: mockResponseMessage
  }
};

export const Streaming: Story = {
  args: {
    isSelectedFile: false,
    isCompletedStream: false,
    responseMessage: mockResponseMessage
  }
};

export const LongFileName: Story = {
  args: {
    isSelectedFile: false,
    isCompletedStream: true,
    responseMessage: {
      ...mockResponseMessage,
      file_name: 'very_long_file_name_that_should_truncate_in_the_ui.txt'
    }
  }
};
