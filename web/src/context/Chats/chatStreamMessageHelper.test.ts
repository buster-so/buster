import { describe, it, expect } from 'vitest';
import {
  initializeOrUpdateMessage,
  updateChatTitle,
  updateResponseMessage,
  updateReasoningMessage
} from './chatStreamMessageHelper';
import type { IBusterChatMessage, IBusterChat } from '@/api/asset_interfaces/chat';
import type { ChatEvent_GeneratingResponseMessage } from '@/api/buster_socket/chats';
import type {
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_text,
  BusterChatMessageReasoning_text,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_pills,
  BusterChatMessageReasoning_file,
  BusterChatMessageReasoning_pillContainer
} from '@/api/asset_interfaces';

const createBaseMessage = (
  messageId: string,
  reasoningMessages: Record<string, any> = {}
): IBusterChatMessage => ({
  id: messageId,
  isCompletedStream: false,
  request_message: {
    request: 'test request',
    sender_id: 'user1',
    sender_name: 'Test User',
    sender_avatar: null
  },
  response_message_ids: [],
  reasoning_message_ids: Object.keys(reasoningMessages),
  response_messages: {},
  reasoning_messages: reasoningMessages,
  created_at: new Date().toISOString(),
  final_reasoning_message: null,
  feedback: null
});

describe('initializeOrUpdateMessage', () => {
  it('should initialize a new message when currentMessage is undefined', () => {
    const messageId = 'test-id';
    const updateFn = (draft: IBusterChatMessage) => {
      if (draft.request_message) {
        draft.request_message.request = 'test request';
      }
    };

    const result = initializeOrUpdateMessage(messageId, undefined, updateFn);

    expect(result.id).toBe(messageId);
    expect(result.isCompletedStream).toBe(false);
    expect(result.request_message?.request).toBe('test request');
    expect(result.created_at).toBeDefined();
    expect(result.final_reasoning_message).toBeNull();
  });

  it('should update an existing message', () => {
    const messageId = 'test-id';
    const currentMessage = createBaseMessage(messageId);

    const updateFn = (draft: IBusterChatMessage) => {
      if (draft.request_message) {
        draft.request_message.request = 'updated request';
      }
    };

    const result = initializeOrUpdateMessage(messageId, currentMessage, updateFn);

    expect(result.id).toBe(messageId);
    expect(result.request_message?.request).toBe('updated request');
  });
});

const mockChat: IBusterChat = {
  id: 'test-chat-id',
  title: 'Initial Title',
  isNewChat: false,
  is_favorited: false,
  message_ids: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user',
  created_by_id: 'test-user-id',
  created_by_name: 'Test User',
  created_by_avatar: null
};

describe('updateChatTitle', () => {
  it('should update title with a chunk when progress is not completed', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: ' New',
      progress: 'in_progress' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Initial Title New');
  });

  it('should set the final title when progress is completed', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: '',
      progress: 'completed' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Final Title');
  });

  it('should handle chat with empty initial title', () => {
    const chatWithoutTitle: IBusterChat = {
      ...mockChat,
      title: ''
    };

    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: ' New',
      progress: 'in_progress' as const
    };

    const result = updateChatTitle(chatWithoutTitle, event);
    expect(result.title).toBe(' New');
  });

  it('should not modify title when title and title_chunk are empty', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: '',
      title_chunk: '',
      progress: 'completed' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Initial Title');
  });
});

describe('updateResponseMessage', () => {
  it('should create a new message when currentMessage is undefined', () => {
    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: 'Hello'
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };
    const result = updateResponseMessage('test-message-id', undefined, mockEvent);

    expect(result.id).toBe('test-message-id');
    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Hello');
  });

  it('should update existing message with new response', () => {
    const currentMessage: IBusterChatMessage = createBaseMessage('test-message-id');
    currentMessage.response_message_ids = ['response-1'];
    currentMessage.response_messages = {
      'response-1': {
        id: 'response-1',
        type: 'text',
        message: 'Hello',
        message_chunk: undefined,
        is_final_message: false
      }
    };

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: ' World'
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Hello World');
  });

  it('should handle large message chunks correctly', () => {
    const currentMessage: IBusterChatMessage = {
      id: 'test-message-id',
      isCompletedStream: false,
      request_message: {
        request: 'test request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: ['response-1'],
      reasoning_message_ids: [],
      response_messages: {
        'response-1': {
          id: 'response-1',
          type: 'text',
          message: 'Initial message',
          message_chunk: undefined,
          is_final_message: false
        }
      },
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null,
      feedback: null
    };

    const largeChunk =
      ' '.repeat(1000) +
      'This is a very large message chunk that should be appended correctly. '.repeat(10);

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: largeChunk
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Initial message' + largeChunk);
  });

  it('should handle file type response messages', () => {
    const responseMessageFile: BusterChatResponseMessage_file = {
      id: 'response-1',
      type: 'file',
      file_name: 'initial.txt',
      file_type: 'metric',
      version_number: 1,
      filter_version_id: '1'
    };

    const currentMessage: IBusterChatMessage = {
      id: 'test-message-id',
      isCompletedStream: false,
      request_message: {
        request: 'test request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: ['response-1'],
      reasoning_message_ids: [],
      response_messages: {
        'response-1': responseMessageFile
      },
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null,
      feedback: null
    };

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: { ...responseMessageFile, id: 'response-2' },
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-2');
    expect(result.response_messages['response-2']).toEqual(mockEvent.response_message);
  });
});

describe('updateReasoningMessage', () => {
  it('should create a new message when currentMessage is undefined', () => {
    const reasoning: BusterChatMessageReasoning_text = {
      id: 'reasoning-1',
      type: 'text',
      message: '',
      message_chunk: 'Initial reasoning',
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    const result = updateReasoningMessage('test-message-id', undefined, reasoning);

    expect(result.id).toBe('test-message-id');
    expect(result.reasoning_message_ids).toContain('reasoning-1');
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Initial reasoning');
  });

  it('should update existing text reasoning message with streaming chunks', () => {
    const currentMessage = createBaseMessage('test-message-id', {
      'reasoning-1': {
        id: 'reasoning-1',
        type: 'text',
        message: 'Initial reasoning',
        message_chunk: undefined,
        title: 'Test Title',
        secondary_title: 'Test Secondary Title',
        status: 'loading'
      }
    });

    const reasoning: BusterChatMessageReasoning_text = {
      id: 'reasoning-1',
      type: 'text',
      message: '',
      message_chunk: ' additional text',
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    const result = updateReasoningMessage('test-message-id', currentMessage, reasoning);

    expect(result.reasoning_message_ids).toContain('reasoning-1');
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Initial reasoning additional text');
  });

  it('should handle files type reasoning message', () => {
    const reasoningFile: BusterChatMessageReasoning_file = {
      id: 'file-1',
      file_type: 'metric',
      file_name: 'test.txt',
      version_number: 1,
      status: 'loading',
      file: {
        text: 'Initial file content',
        modified: [[0, 0]]
      }
    };

    const currentMessage = createBaseMessage('test-message-id', {
      'reasoning-1': {
        id: 'reasoning-1',
        type: 'files',
        file_ids: ['file-1'],
        files: {
          'file-1': reasoningFile
        },
        title: 'Test Title',
        secondary_title: 'Test Secondary Title',
        status: 'loading'
      }
    });

    const reasoning: BusterChatMessageReasoning_files = {
      id: 'reasoning-1',
      type: 'files',
      file_ids: ['file-1'],
      files: {
        'file-1': {
          ...reasoningFile,
          file: {
            text: 'Initial file content',
            text_chunk: ' additional content',
            modified: [[0, 0]]
          }
        }
      },
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    const result = updateReasoningMessage('test-message-id', currentMessage, reasoning);

    expect(result.reasoning_message_ids).toContain('reasoning-1');
    const updatedFile = result.reasoning_messages[
      'reasoning-1'
    ] as BusterChatMessageReasoning_files;
    expect(updatedFile.files['file-1'].file?.text).toBe('Initial file content additional content');
    expect(updatedFile.files['file-1'].file?.modified).toEqual([[0, 0]]);
  });

  it('should handle pills type reasoning message', () => {
    const pillContainer: BusterChatMessageReasoning_pillContainer = {
      title: 'Test Container',
      pills: [
        {
          id: 'pill-1',
          text: 'Test Pill 1',
          type: null
        }
      ]
    };

    const currentMessage = createBaseMessage('test-message-id', {
      'reasoning-1': {
        id: 'reasoning-1',
        type: 'pills',
        pill_containers: [pillContainer],
        title: 'Test Title',
        secondary_title: 'Test Secondary Title',
        status: 'loading'
      }
    });

    const reasoning: BusterChatMessageReasoning_pills = {
      id: 'reasoning-1',
      type: 'pills',
      pill_containers: [
        pillContainer,
        {
          title: 'Test Container 2',
          pills: [
            {
              id: 'pill-2',
              text: 'Test Pill 2',
              type: null
            }
          ]
        }
      ],
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    const result = updateReasoningMessage('test-message-id', currentMessage, reasoning);

    expect(result.reasoning_message_ids).toContain('reasoning-1');
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_pills).pill_containers
    ).toHaveLength(2);
  });

  it('should handle multiple file updates in a single reasoning message', () => {
    const reasoningFile1: BusterChatMessageReasoning_file = {
      id: 'file-1',
      file_type: 'metric',
      file_name: 'test1.txt',
      version_number: 1,
      status: 'loading',
      file: {
        text: 'Initial content',
        modified: [[0, 0]]
      }
    };

    const reasoningFile2: BusterChatMessageReasoning_file = {
      id: 'file-2',
      file_type: 'metric',
      file_name: 'test2.txt',
      version_number: 1,
      status: 'loading',
      file: {
        text: 'New file content',
        modified: [[0, 0]]
      }
    };

    const currentMessage = createBaseMessage('test-message-id', {
      'reasoning-1': {
        id: 'reasoning-1',
        type: 'files',
        file_ids: ['file-1'],
        files: {
          'file-1': reasoningFile1
        },
        title: 'Test Title',
        secondary_title: 'Test Secondary Title',
        status: 'loading'
      }
    });

    const reasoning: BusterChatMessageReasoning_files = {
      id: 'reasoning-1',
      type: 'files',
      file_ids: ['file-1', 'file-2'],
      files: {
        'file-1': {
          ...reasoningFile1,
          file: {
            text: 'Initial content',
            text_chunk: ' additional content',
            modified: [[0, 0]]
          }
        },
        'file-2': reasoningFile2
      },
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    const result = updateReasoningMessage('test-message-id', currentMessage, reasoning);

    expect(result.reasoning_message_ids).toContain('reasoning-1');
    const updatedFiles = result.reasoning_messages[
      'reasoning-1'
    ] as BusterChatMessageReasoning_files;
    expect(updatedFiles.file_ids).toContain('file-1');
    expect(updatedFiles.file_ids).toContain('file-2');
    expect(updatedFiles.files['file-1'].file?.text).toBe('Initial content additional content');
    expect(updatedFiles.files['file-2'].file?.text).toBe('New file content');
  });

  it('should handle multiple updates and append text to existing reasoning message', () => {
    const messageId = 'test-message-id';
    let reasoning: BusterChatMessageReasoning_text = {
      id: 'reasoning-1',
      type: 'text',
      message: '',
      message_chunk: 'Hello',
      title: 'Test Title',
      secondary_title: 'Test Secondary Title',
      status: 'loading'
    };

    // First update with "Hello"
    let result = updateReasoningMessage(messageId, undefined, reasoning);
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Hello');

    // Second update with ", how"
    reasoning = {
      ...reasoning,
      message_chunk: ', how'
    };
    result = updateReasoningMessage(messageId, result, reasoning);
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Hello, how');

    // Third update with " are you doing today?"
    reasoning = {
      ...reasoning,
      message_chunk: ' are you doing today?'
    };
    result = updateReasoningMessage(messageId, result, reasoning);
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Hello, how are you doing today?');

    const reasoning2: BusterChatMessageReasoning_text = {
      ...reasoning,
      message_chunk: 'new reasoning message baby',
      id: 'reasoning-2'
    };

    result = updateReasoningMessage(messageId, result, reasoning2);
    expect(
      (result.reasoning_messages['reasoning-1'] as BusterChatMessageReasoning_text).message
    ).toBe('Hello, how are you doing today?');

    expect(result.reasoning_message_ids).toContain('reasoning-2');
    expect(result.reasoning_message_ids.length).toBe(2);
    expect(
      (result.reasoning_messages['reasoning-2'] as BusterChatMessageReasoning_text).message
    ).toBe('new reasoning message baby');
  });
});
