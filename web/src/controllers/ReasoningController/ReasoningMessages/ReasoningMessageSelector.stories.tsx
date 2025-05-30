import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockBusterChatMessage } from '@/mocks/chat';
import { ReasoningMessageSelector } from './ReasoningMessageSelector';

const meta: Meta<typeof ReasoningMessageSelector> = {
  title: 'Controllers/ReasoningController/ReasoningMessageSelector',
  component: ReasoningMessageSelector,
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

      // Pre-populate the query cache with our mock data
      queryClient.setQueryData(['chats', 'messages', 'message-1'], mockBusterChatMessage);
      queryClient.setQueryData(['chats', 'messages', 'message-2'], mockBusterChatMessage);
      queryClient.setQueryData(['chats', 'messages', 'message-3'], mockBusterChatMessage);
      queryClient.setQueryData(['chats', 'messages', 'empty-message'], {
        ...mockBusterChatMessage,
        reasoning_messages: {
          'reasoning-1': {
            id: 'reasoning-1',
            type: 'text',
            title: 'Text Reasoning',
            secondary_title: 'Additional Context',
            message: '',
            status: 'completed'
          }
        }
      });

      return (
        <QueryClientProvider client={queryClient}>
          <div className="h-full w-full max-w-[400px] min-w-[400px]">
            <Story />
          </div>
        </QueryClientProvider>
      );
    }
  ],
  argTypes: {
    reasoningMessageId: {
      control: 'select',
      options: ['reasoning-1', 'reasoning-2', 'reasoning-3']
    },
    isCompletedStream: {
      control: 'boolean',
      defaultValue: false
    }
  }
};

export default meta;
type Story = StoryObj<typeof ReasoningMessageSelector>;

export const TextReasoning: Story = {
  args: {
    reasoningMessageId: 'reasoning-1',
    messageId: 'message-1',
    isCompletedStream: false,
    chatId: 'chat-1'
  }
};

export const TextEmptyReasoning: Story = {
  args: {
    reasoningMessageId: 'reasoning-1',
    messageId: 'empty-message',
    isCompletedStream: false,
    chatId: 'chat-1',
    isLastMessage: false
  }
};

export const PillsReasoning: Story = {
  args: {
    reasoningMessageId: 'reasoning-2',
    messageId: 'message-2',
    isCompletedStream: false,
    chatId: 'chat-1'
  }
};

export const FilesReasoning: Story = {
  args: {
    reasoningMessageId: 'reasoning-3',
    messageId: 'message-3',
    isCompletedStream: false,
    chatId: 'chat-1'
  }
};

export const SameIdDifferentTypes: Story = {
  args: {
    reasoningMessageId: 'reasoning-1',
    messageId: 'message-1',
    isCompletedStream: false,
    chatId: 'chat-1'
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false
          }
        }
      });

      // Create the different message types data
      const messageTypes = {
        text: {
          id: 'reasoning-1',
          type: 'text',
          title: 'Text Type',
          secondary_title: 'This is a text message',
          message:
            'This is a text message that can change types. The message can be a long message that can be scrolled. The message can be a short message that can be displayed in a single line. The message can be a long message that can be scrolled. The message can be a short message that.',
          status: 'completed'
        },
        pills: {
          id: 'reasoning-1',
          type: 'pills',
          title: 'Pills Type',
          secondary_title: 'This is a pills message',
          status: 'completed',
          pill_containers: [
            {
              title: 'Dynamic Pills',
              pills: [
                { text: 'Pill 1', type: 'metric', id: 'pill-1' },
                { text: 'Pill 2', type: 'dashboard', id: 'pill-2' }
              ]
            },
            {
              title: 'Dynamic Pills Secondary',
              pills: [
                { text: 'Pill 3', type: 'metric', id: 'pill-3' },
                { text: 'Pill 4', type: 'dashboard', id: 'pill-4' },
                { text: 'Pill 5', type: 'dashboard', id: 'pill-5' }
              ]
            },
            {
              title: 'Dynamic Pills Tertiary',
              pills: [
                { text: 'Pill 6', type: 'metric', id: 'pill-6' },
                { text: 'Pill 7', type: 'dashboard', id: 'pill-7' },
                { text: 'Pill 8', type: 'dashboard', id: 'pill-8' },
                { text: 'Pill 9', type: 'dashboard', id: 'pill-9' },
                { text: 'Pill 10', type: 'dashboard', id: 'pill-10' }
              ]
            },
            {
              title: 'Dynamic Pills Quaternary',
              pills: [
                { text: 'Pill 11', type: 'metric', id: 'pill-11' },
                { text: 'Pill 12', type: 'dashboard', id: 'pill-12' }
              ]
            }
          ]
        },
        files: {
          id: 'reasoning-1',
          type: 'files',
          title: 'Files Type',
          secondary_title: 'This is a files message',
          status: 'completed',
          file_ids: ['dynamic-file-1'],
          files: {
            'dynamic-file-1': {
              id: 'dynamic-file-1',
              file_type: 'metric',
              file_name: 'dynamic.ts',
              version_number: 1,
              version_id: 'v1',
              status: 'completed',
              file: {
                text: 'console.swag("Dynamic content");\n',
                modified: [[1, 1]]
              }
            }
          }
        }
      };

      // Function to update the message type
      const updateMessageType = (type: 'text' | 'pills' | 'files') => {
        queryClient.setQueryData(['chats', 'messages', 'message-1'], {
          ...mockBusterChatMessage,
          reasoning_messages: {
            'reasoning-1': messageTypes[type]
          }
        });
      };

      // Set initial data
      updateMessageType('text');

      return (
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col gap-4">
            <select
              className="rounded border p-2"
              onChange={(e) => updateMessageType(e.target.value as 'text' | 'pills' | 'files')}
              defaultValue="text">
              <option value="text">Text Type</option>
              <option value="pills">Pills Type</option>
            </select>
            <div className="h-full w-full max-w-[400px] min-w-[400px]">
              <Story />
            </div>
          </div>
        </QueryClientProvider>
      );
    }
  ]
};

export const InteractiveTitles: Story = {
  args: {
    reasoningMessageId: 'reasoning-1',
    messageId: 'message-1',
    isCompletedStream: false,
    chatId: 'chat-1'
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false
          }
        }
      });

      // Initial message data
      const initialMessage = {
        ...mockBusterChatMessage,
        reasoning_messages: {
          'reasoning-1': {
            id: 'reasoning-1',
            type: 'text',
            title: 'Initial Title',
            secondary_title: 'Initial Secondary Title',
            message: 'This is the initial message content.',
            status: 'completed'
          }
        }
      };

      // Set initial data
      queryClient.setQueryData(['chats', 'messages', 'message-1'], initialMessage);

      // Function to update the message
      const updateMessage = (
        updates: Partial<(typeof initialMessage.reasoning_messages)['reasoning-1']>
      ) => {
        const currentData = queryClient.getQueryData([
          'chats',
          'messages',
          'message-1'
        ]) as typeof initialMessage;
        queryClient.setQueryData(['chats', 'messages', 'message-1'], {
          ...currentData,
          reasoning_messages: {
            'reasoning-1': {
              ...currentData.reasoning_messages['reasoning-1'],
              ...updates
            }
          }
        });
      };

      return (
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                className="cursor-pointer rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={() =>
                  updateMessage({ title: `New Title ${Math.floor(Math.random() * 1000)}` })
                }>
                Change Title
              </button>
              <button
                className="cursor-pointer rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                onClick={() =>
                  updateMessage({
                    secondary_title: `New Secondary Title ${Math.floor(Math.random() * 1000)}`
                  })
                }>
                Change Secondary Title
              </button>
              <button
                className="cursor-pointer rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
                onClick={() => {
                  const currentData = queryClient.getQueryData([
                    'chats',
                    'messages',
                    'message-1'
                  ]) as typeof initialMessage;
                  const currentSecondaryTitle =
                    currentData.reasoning_messages['reasoning-1'].secondary_title;
                  updateMessage({
                    secondary_title: currentSecondaryTitle
                      ? ''
                      : 'This is the toggled secondary title.'
                  });
                }}>
                Toggle Secondary Title
              </button>
              <button
                className="cursor-pointer rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                onClick={() => {
                  const randomNum = Math.floor(Math.random() * 1000);
                  updateMessage({
                    title: `New Combined Title ${randomNum}`,
                    secondary_title: `New Combined Secondary Title ${randomNum}`
                  });
                }}>
                Change Both Titles
              </button>
            </div>
            <div className="h-full w-full max-w-[400px] min-w-[400px]">
              <Story />
            </div>
          </div>
        </QueryClientProvider>
      );
    }
  ]
};
