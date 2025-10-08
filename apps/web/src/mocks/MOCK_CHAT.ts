import type {
  BusterChat,
  BusterChatMessage,
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_file,
  BusterChatMessageResponse,
} from '@/api/asset_interfaces';

// Helper functions for predictable data generation
const generateId = (prefix: string, index = 0) => `${prefix}-${index}`;
const generateTimestamp = (index = 0) => new Date(2024, 0, 1, 0, 0, index).toISOString();

const MOCK_MESSAGE_RESPONSE = (
  typeProp?: 'text' | 'file',
  index = 0
): BusterChatMessageResponse => {
  const type = typeProp || (index % 2 === 0 ? 'text' : 'file');

  if (type === 'text') {
    return {
      id: generateId('response', index),
      type,
      message: `Sample message ${index}`,
      is_final_message: false,
    };
  }

  return {
    id: generateId('response', index),
    type: 'file',
    file_type: index % 2 === 0 ? 'metric_file' : 'dashboard_file',
    file_name: `sample-file-${index}.txt`,
    version_number: (index % 5) + 1,
    filter_version_id: generateId('filter', index),
    metadata: [
      {
        status: 'completed',
        message: `Create your file ${index}`,
        timestamp: 4200 + index,
      },
    ],
  };
};

const MOCK_MESSAGE_REASONING = (
  typeProp?: 'text' | 'files' | 'pills',
  index = 0
): BusterChatMessageReasoning => {
  const type = typeProp || ['text', 'files', 'pills'][index % 3];

  if (type === 'text') {
    return {
      id: generateId('reasoning', index),
      type: 'text',
      title: `Sample title ${index}`,
      status: 'completed',
      message: `Sample reasoning message ${index}`,
      secondary_title: '4.2 seconds',
    };
  }

  if (type === 'files') {
    const MOCK_FILE = (fileIndex: number): BusterChatMessageReasoning_file => {
      return {
        id: generateId('file', fileIndex),
        file_type: fileIndex % 2 === 0 ? 'metric_file' : 'dashboard_file',
        file_name: `file-${fileIndex}.txt`,
        version_number: (fileIndex % 5) + 1,
        status: 'loading',
        file: {
          text: `Sample file text ${fileIndex}`,
          modified: [[0, 100]],
        },
      };
    };

    const files = Array.from({ length: 3 }, (_, i) => MOCK_FILE(i + index));

    return {
      id: generateId('reasoning', index),
      type: 'files',
      title: `Sample files title ${index}`,
      secondary_title: `Sample secondary title ${index}`,
      status: 'completed',
      file_ids: files.map((f) => f.id),
      files: files.reduce<Record<string, BusterChatMessageReasoning_file>>((acc, f) => {
        acc[f.id] = f;
        return acc;
      }, {}),
    };
  }

  return {
    id: generateId('reasoning', index),
    type: 'pills',
    title: `Sample pills title ${index}`,
    status: 'completed',
    secondary_title: '4.2 seconds',
    pill_containers: [
      {
        title: `Sample pill container ${index}`,
        pills: [],
      },
    ],
  };
};

const MOCK_MESSAGE = (messageIndex = 0): BusterChatMessage => {
  const responseTypes: ('text' | 'file')[] = ['text', 'file', 'file', 'file', 'text'];
  const responseMessage = Array.from({ length: 5 }, (_, i) =>
    MOCK_MESSAGE_RESPONSE(responseTypes[i], i + messageIndex * 5)
  );

  const reasoningTypes: ('text' | 'files' | 'pills')[] = [
    'text',
    'pills',
    'files',
    'text',
    'files',
  ];
  const reasoningMessage = Array.from({ length: 5 }, (_, i) =>
    MOCK_MESSAGE_REASONING(reasoningTypes[i], i + messageIndex * 5)
  );

  return {
    id: generateId('message', messageIndex),
    created_at: generateTimestamp(messageIndex),
    updated_at: generateTimestamp(messageIndex),
    is_completed: false,
    request_message: {
      request: `Sample request ${messageIndex}`,
      sender_id: generateId('sender', messageIndex),
      sender_name: `User ${messageIndex}`,
      sender_avatar: `https://avatar.example.com/user${messageIndex}.jpg`,
    },
    final_reasoning_message: null,
    response_message_ids: responseMessage.map((m) => m.id),
    response_messages: responseMessage.reduce<Record<string, BusterChatMessageResponse>>(
      (acc, m) => {
        acc[m.id] = m;
        return acc;
      },
      {}
    ),
    reasoning_messages: reasoningMessage.reduce<Record<string, BusterChatMessageReasoning>>(
      (acc, m) => {
        acc[m.id] = m;
        return acc;
      },
      {}
    ),
    feedback: null,
    reasoning_message_ids: reasoningMessage.map((m) => m.id),
  };
};

export const MOCK_CHAT = (chatIndex = 0): BusterChat => {
  const messages = Array.from({ length: 3 }, (_, i) => MOCK_MESSAGE(i + chatIndex * 3));
  const messageIds = messages.map((m) => m.id);

  return {
    id: generateId('chat', chatIndex),
    title: `Sample Chat ${chatIndex}`,
    is_favorited: chatIndex % 2 === 0,
    message_ids: messageIds,
    messages: messages.reduce<Record<string, BusterChatMessage>>((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {}),
    created_at: generateTimestamp(chatIndex),
    updated_at: generateTimestamp(chatIndex + 1),
    created_by: `User ${chatIndex}`,
    created_by_id: generateId('user', chatIndex),
    created_by_name: `User ${chatIndex}`,
    created_by_avatar: `https://avatar.example.com/user${chatIndex}.jpg`,
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    permission: 'owner',
    workspace_sharing: 'full_access',
    workspace_member_count: 0,
    individual_permissions: [],
    screenshot_taken_at: null,
  };
};
