import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReasoningMessage_Text } from './ReasoningMessage_Text';
import type { IBusterChatMessage } from '@/api/asset_interfaces/chat';

const meta: Meta<typeof ReasoningMessage_Text> = {
  title: 'Controllers/ReasoningController/ReasoningMessage_Text',
  component: ReasoningMessage_Text,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            queryFn: () => Promise.resolve()
          }
        }
      });

      // Mock message data with text reasoning
      const mockMessage: IBusterChatMessage = {
        id: 'mock-message-id',
        is_completed: true,
        created_at: '2024-01-01T00:00:00Z',
        request_message: {
          request: 'test request',
          sender_id: 'user1',
          sender_name: 'Test User',
          sender_avatar: null
        },
        response_message_ids: [],
        response_messages: {},
        reasoning_message_ids: ['reasoning-msg-1'],
        reasoning_messages: {
          'reasoning-msg-1': {
            id: 'reasoning-msg-1',
            type: 'text',
            title: 'Analysis',
            secondary_title: 'Processing request',
            message: '## Analysis Results\n\nThis is a **markdown** formatted reasoning message',
            status: 'completed'
          }
        },
        final_reasoning_message: null,
        feedback: null
      };

      // Pre-populate the query cache with our mock data
      queryClient.setQueryData(['chats', 'messages', 'mock-message-id'], mockMessage);

      return (
        <QueryClientProvider client={queryClient}>
          <div className="max-w-md">
            <Story />
          </div>
        </QueryClientProvider>
      );
    }
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    reasoningMessageId: 'reasoning-msg-1',
    messageId: 'mock-message-id',
    isCompletedStream: true,
    chatId: 'mock-chat-id'
  }
};
