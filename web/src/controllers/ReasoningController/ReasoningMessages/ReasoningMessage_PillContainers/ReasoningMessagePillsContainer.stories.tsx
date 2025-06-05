import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { BusterChatMessageReasoning_pills, ThoughtFileType } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { ReasoningMessagePillsContainer } from './ReasoningMessagePillsContainer';

const meta: Meta<typeof ReasoningMessagePillsContainer> = {
  title: 'Controllers/ReasoningController/ReasoningMessagePillsContainer',
  component: ReasoningMessagePillsContainer,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-2">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ReasoningMessagePillsContainer>;

const mockReasoningMessage: BusterChatMessageReasoning_pills = {
  id: '1',
  type: 'pills',
  title: 'Found Terms',
  secondary_title: '4.2 seconds',
  pill_containers: [
    {
      title: 'Important Terms',
      pills: [
        { text: 'React', type: 'term', id: '1' },
        { text: 'TypeScript', type: 'term', id: '2' },
        { text: 'Components', type: 'term', id: '3' }
      ]
    },
    {
      title: 'Technical Concepts',
      pills: [
        { text: 'State Management', type: 'term', id: '4' },
        { text: 'Props', type: 'term', id: '5' },
        { text: 'Hooks', type: 'term', id: '6' }
      ]
    }
  ],
  status: 'completed'
};

export const Default: Story = {
  args: {
    ...mockReasoningMessage,
    isCompletedStream: true
  }
};

const InteractiveLoadingWrapper = () => {
  const [pillContainers, setPillContainers] = useState([...mockReasoningMessage.pill_containers!]);

  const addNewContainer = () => {
    const newContainer = {
      title: `Container ${pillContainers.length + 1}`,
      pills: [
        {
          text: `Term ${Math.random().toString(36).slice(2, 7)}`,
          type: 'term' as ThoughtFileType,
          id: Math.random().toString()
        },
        {
          text: `Term ${Math.random().toString(36).slice(2, 7)}`,
          type: 'term' as ThoughtFileType,
          id: Math.random().toString()
        }
      ]
    };
    setPillContainers([...pillContainers, newContainer]);
  };

  const chatId = '123';

  const message: BusterChatMessageReasoning_pills = {
    ...mockReasoningMessage,
    status: 'loading',
    pill_containers: pillContainers
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={addNewContainer} variant="default">
        Add New Container
      </Button>
      <ReasoningMessagePillsContainer {...message} chatId={chatId} isCompletedStream={false} />
    </div>
  );
};

export const Loading: Story = {
  render: () => <InteractiveLoadingWrapper />
};

export const LoadingTextThenPills: Story = {
  render: () => <InteractiveLoadingWrapper />
};

export const Failed: Story = {
  args: {
    ...mockReasoningMessage,
    status: 'failed',
    isCompletedStream: true
  }
};

export const EmptyPills: Story = {
  args: {
    ...mockReasoningMessage,
    pill_containers: [],
    isCompletedStream: true
  }
};

export const SingleContainer: Story = {
  args: {
    ...mockReasoningMessage,
    pill_containers: [mockReasoningMessage.pill_containers![0]],
    isCompletedStream: true
  }
};

export const ManyPills: Story = {
  args: {
    ...mockReasoningMessage,
    pill_containers: [
      {
        title: 'Container with Many Pills',
        pills: Array.from({ length: 40 }, (_, index) => ({
          text: `Term ${index + 1}`,
          type: 'term' as ThoughtFileType,
          id: `many-${index + 1}`
        }))
      }
    ],
    isCompletedStream: false
  }
};
