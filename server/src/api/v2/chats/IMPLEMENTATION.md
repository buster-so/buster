# Chat Handler Implementation Guide

This document provides a comprehensive step-by-step implementation plan for creating a robust TypeScript chat handler that replaces the current stub implementation with a full-featured system.

## Overview

The implementation will transform the current simple stub handler into a comprehensive chat system that:
- Creates new chats and adds messages to existing chats
- Returns complete `ChatWithMessages` objects instead of just `message_id`
- Integrates with asset-based chats (metric_file/dashboard_file)
- Triggers background analyst processing without blocking
- Uses modular database helpers for maintainability and testability
- Includes comprehensive error handling and validation

## Phase 1: Type System & Database Foundation

### 1.1 Enhanced Type Definitions

**File: `src/types/chat.types.ts`**

```typescript
import { z } from 'zod';
import type { InferSelectModel } from 'drizzle-orm';
import type { chats, messages } from '@buster/database';

// Enhanced schemas for comprehensive chat handling
const AssetType = z.enum(['metric_file', 'dashboard_file']);

export const ChatCreateRequestSchema = z
  .object({
    prompt: z.string().min(1, 'Prompt is required').optional(),
    chat_id: z.string().uuid().optional(),
    message_id: z.string().uuid().optional(),
    asset_id: z.string().uuid().optional(),
    asset_type: AssetType.optional(),
  })
  .refine((data) => !data.asset_id || data.asset_type, {
    message: 'asset_type must be provided when asset_id is specified',
    path: ['asset_type'],
  })
  .refine((data) => data.prompt || data.chat_id, {
    message: 'Either prompt (for new chat) or chat_id (for existing chat) must be provided',
    path: ['prompt'],
  });

// Enhanced response schema returning full chat with messages
export const ChatWithMessagesSchema = z.object({
  chat: z.object({
    id: z.string().uuid(),
    title: z.string(),
    organizationId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string().uuid(),
    publiclyAccessible: z.boolean(),
    mostRecentFileId: z.string().uuid().nullable(),
    mostRecentFileType: z.string().nullable(),
    mostRecentVersionNumber: z.number().nullable(),
  }),
  messages: z.array(z.object({
    id: z.string().uuid(),
    requestMessage: z.string().nullable(),
    responseMessages: z.any(),
    reasoning: z.any(),
    title: z.string(),
    rawLlmMessages: z.any(),
    finalReasoningMessage: z.string().nullable(),
    chatId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string().uuid(),
    isCompleted: z.boolean(),
    feedback: z.string().nullable(),
  })),
  newMessageId: z.string().uuid(), // ID of the newly created message
});

export const ChatCreateResponseSchema = ChatWithMessagesSchema;

// Handler request schema (internal processing)
export const ChatCreateHandlerRequestSchema = z.object({
  prompt: z.string().optional(),
  chat_id: z.string().uuid().optional(),
  message_id: z.string().uuid().optional(),
  asset_id: z.string().uuid().optional(),
  asset_type: AssetType.optional(),
  // User context (injected by middleware)
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

// Infer types
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateResponse = z.infer<typeof ChatCreateResponseSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;
export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;

// Database entity types
export type Chat = InferSelectModel<typeof chats>;
export type Message = InferSelectModel<typeof messages>;

// Asset context for chat creation
export type AssetContext = {
  assetId: string;
  assetType: 'metric_file' | 'dashboard_file';
  assetName?: string;
  assetData?: any;
};

// Error types for structured error handling
export const ChatErrorSchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR',
    'CHAT_NOT_FOUND',
    'MESSAGE_NOT_FOUND',
    'ASSET_NOT_FOUND',
    'PERMISSION_DENIED',
    'DATABASE_ERROR',
    'TRIGGER_ERROR',
    'INTERNAL_ERROR'
  ]),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

export type ChatError = z.infer<typeof ChatErrorSchema>;
```

### 1.2 Database Helper Modules

**File: `packages/database/src/helpers/chats.ts`**

```typescript
import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../connection';
import { chats, messages } from '../schema';

export type Chat = InferSelectModel<typeof chats>;
export type ChatWithMessages = {
  chat: Chat;
  messages: Message[];
};

/**
 * Create a new chat
 */
export async function createChat(data: {
  title: string;
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
}): Promise<Chat> {
  const chatData = {
    ...data,
    updatedBy: data.updatedBy || data.createdBy,
  };

  const result = await db.insert(chats).values(chatData).returning();
  return result[0];
}

/**
 * Get chat by ID with permission checking
 */
export async function getChatById(
  chatId: string,
  userId: string,
  organizationId: string
): Promise<Chat | null> {
  const result = await db
    .select()
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.organizationId, organizationId),
        isNull(chats.deletedAt)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get chat with all messages
 */
export async function getChatWithMessages(
  chatId: string,
  userId: string,
  organizationId: string
): Promise<ChatWithMessages | null> {
  const chat = await getChatById(chatId, userId, organizationId);
  if (!chat) return null;

  const chatMessages = await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt));

  return {
    chat,
    messages: chatMessages,
  };
}

/**
 * Update chat metadata
 */
export async function updateChat(
  chatId: string,
  updates: Partial<Pick<Chat, 'title' | 'mostRecentFileId' | 'mostRecentFileType' | 'mostRecentVersionNumber'>>,
  updatedBy: string
): Promise<Chat | null> {
  const result = await db
    .update(chats)
    .set({
      ...updates,
      updatedBy,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .returning();

  return result[0] || null;
}

/**
 * Check if user has access to chat
 */
export async function checkChatAccess(
  chatId: string,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db
    .select({ id: chats.id })
    .from(chats)
    .where(
      and(
        eq(chats.id, chatId),
        eq(chats.organizationId, organizationId),
        isNull(chats.deletedAt)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Generate a contextual chat title from prompt
 */
export function generateChatTitle(prompt: string, assetContext?: AssetContext): string {
  const maxLength = 100;
  
  let title = prompt.trim();
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }

  if (assetContext) {
    const assetTypeLabel = assetContext.assetType === 'metric_file' ? 'Metric' : 'Dashboard';
    const assetName = assetContext.assetName ? ` (${assetContext.assetName})` : '';
    title = `${assetTypeLabel}${assetName}: ${title}`;
  }

  return title;
}
```

**File: `packages/database/src/helpers/messages.ts` (additions)**

```typescript
// Add to existing messages.ts file

/**
 * Create a new message in a chat
 */
export async function createMessage(data: {
  requestMessage: string | null;
  responseMessages: any;
  reasoning: any;
  title: string;
  rawLlmMessages: any;
  chatId: string;
  createdBy: string;
  finalReasoningMessage?: string | null;
}): Promise<Message> {
  const result = await db.insert(messages).values(data).returning();
  return result[0];
}

/**
 * Create a placeholder message for background processing
 */
export async function createPlaceholderMessage(data: {
  requestMessage: string;
  chatId: string;
  createdBy: string;
  title: string;
}): Promise<Message> {
  const placeholderData = {
    ...data,
    responseMessages: { status: 'processing', messages: [] },
    reasoning: { status: 'processing', steps: [] },
    rawLlmMessages: [],
    isCompleted: false,
  };

  return createMessage(placeholderData);
}

/**
 * Mark message as completed
 */
export async function markMessageCompleted(messageId: string): Promise<void> {
  await db
    .update(messages)
    .set({
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)));
}
```

## Phase 2: Core Handler Implementation

### 2.1 Asset Integration Module

**File: `src/utils/assets.ts`**

```typescript
import type { AssetContext } from '../types/chat.types';

/**
 * Resolve asset context from asset_id and asset_type
 */
export async function resolveAssetContext(
  assetId: string,
  assetType: 'metric_file' | 'dashboard_file',
  organizationId: string
): Promise<AssetContext | null> {
  try {
    // TODO: Implement actual asset lookup based on assetType
    // This would query the appropriate table (metric_files or dashboard_files)
    // and return structured asset information
    
    // Placeholder implementation
    return {
      assetId,
      assetType,
      assetName: `${assetType === 'metric_file' ? 'Metric' : 'Dashboard'} ${assetId.slice(0, 8)}`,
      assetData: {
        // Asset-specific metadata would go here
      },
    };
  } catch (error) {
    console.error('Failed to resolve asset context:', error);
    return null;
  }
}

/**
 * Validate asset access permissions
 */
export async function validateAssetAccess(
  assetId: string,
  assetType: 'metric_file' | 'dashboard_file',
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    // TODO: Implement actual permission checking
    // This would check asset_permissions table or similar
    
    // Placeholder implementation - assume access granted
    return true;
  } catch (error) {
    console.error('Failed to validate asset access:', error);
    return false;
  }
}
```

### 2.2 Enhanced Handler Implementation

**File: `src/api/v2/chats/handler.ts`**

```typescript
import { tasks } from '@trigger.dev/sdk/v3';
import {
  createChat,
  getChatWithMessages,
  updateChat,
  checkChatAccess,
  generateChatTitle,
} from '@buster/database/helpers/chats';
import {
  createPlaceholderMessage,
  getMessagesForChat,
} from '@buster/database/helpers/messages';
import type { analystagentTask } from '~/trigger/tasks/analyst-agent-task';
import type {
  ChatCreateHandlerRequest,
  ChatCreateResponse,
  ChatError,
  AssetContext,
} from '../../../types/chat.types';
import { resolveAssetContext, validateAssetAccess } from '../../../utils/assets';
import { logger } from '../../../utils/logger';

/**
 * Enhanced chat creation handler with full functionality
 */
export async function createChatHandler(
  request: ChatCreateHandlerRequest
): Promise<ChatCreateResponse> {
  const startTime = Date.now();
  let assetContext: AssetContext | null = null;

  try {
    // Phase 1: Validate and resolve asset context if provided
    if (request.asset_id && request.asset_type) {
      assetContext = await resolveAssetContext(
        request.asset_id,
        request.asset_type,
        request.organizationId
      );

      if (!assetContext) {
        throw createChatError('ASSET_NOT_FOUND', `Asset not found: ${request.asset_id}`);
      }

      const hasAccess = await validateAssetAccess(
        request.asset_id,
        request.asset_type,
        request.userId,
        request.organizationId
      );

      if (!hasAccess) {
        throw createChatError('PERMISSION_DENIED', 'Insufficient permissions to access asset');
      }
    }

    // Phase 2: Handle existing chat or create new chat
    let chatWithMessages;
    let newMessage;

    if (request.chat_id) {
      // Adding to existing chat
      const hasAccess = await checkChatAccess(
        request.chat_id,
        request.userId,
        request.organizationId
      );

      if (!hasAccess) {
        throw createChatError('CHAT_NOT_FOUND', `Chat not found or access denied: ${request.chat_id}`);
      }

      // Create new message in existing chat
      if (!request.prompt) {
        throw createChatError('VALIDATION_ERROR', 'Prompt is required when adding to existing chat');
      }

      const messageTitle = generateMessageTitle(request.prompt);
      newMessage = await createPlaceholderMessage({
        requestMessage: request.prompt,
        chatId: request.chat_id,
        createdBy: request.userId,
        title: messageTitle,
      });

      // Get updated chat with messages
      chatWithMessages = await getChatWithMessages(
        request.chat_id,
        request.userId,
        request.organizationId
      );

      if (!chatWithMessages) {
        throw createChatError('DATABASE_ERROR', 'Failed to retrieve chat after message creation');
      }
    } else {
      // Creating new chat
      if (!request.prompt) {
        throw createChatError('VALIDATION_ERROR', 'Prompt is required for new chat creation');
      }

      const chatTitle = generateChatTitle(request.prompt, assetContext);
      
      const newChat = await createChat({
        title: chatTitle,
        organizationId: request.organizationId,
        createdBy: request.userId,
      });

      const messageTitle = generateMessageTitle(request.prompt);
      newMessage = await createPlaceholderMessage({
        requestMessage: request.prompt,
        chatId: newChat.id,
        createdBy: request.userId,
        title: messageTitle,
      });

      // Update chat with most recent message info
      await updateChat(
        newChat.id,
        {
          mostRecentFileId: assetContext?.assetId || null,
          mostRecentFileType: assetContext?.assetType || null,
          mostRecentVersionNumber: 1,
        },
        request.userId
      );

      // Get complete chat with messages
      chatWithMessages = await getChatWithMessages(
        newChat.id,
        request.userId,
        request.organizationId
      );

      if (!chatWithMessages) {
        throw createChatError('DATABASE_ERROR', 'Failed to retrieve chat after creation');
      }
    }

    // Phase 3: Trigger background processing (fire-and-forget)
    try {
      await tasks.trigger<typeof analystagentTask>('analyst-agent-task', {
        message_id: newMessage.id,
      });
      
      logger.info('Analyst agent task triggered successfully', {
        messageId: newMessage.id,
        chatId: chatWithMessages.chat.id,
        userId: request.userId,
      });
    } catch (triggerError) {
      // Log error but don't fail the request - background processing failure
      // shouldn't block the user's immediate response
      logger.error('Failed to trigger analyst agent task', {
        error: triggerError,
        messageId: newMessage.id,
        chatId: chatWithMessages.chat.id,
      });
    }

    // Phase 4: Return complete response
    const response: ChatCreateResponse = {
      chat: {
        id: chatWithMessages.chat.id,
        title: chatWithMessages.chat.title,
        organizationId: chatWithMessages.chat.organizationId,
        createdAt: chatWithMessages.chat.createdAt,
        updatedAt: chatWithMessages.chat.updatedAt,
        createdBy: chatWithMessages.chat.createdBy,
        publiclyAccessible: chatWithMessages.chat.publiclyAccessible,
        mostRecentFileId: chatWithMessages.chat.mostRecentFileId,
        mostRecentFileType: chatWithMessages.chat.mostRecentFileType,
        mostRecentVersionNumber: chatWithMessages.chat.mostRecentVersionNumber,
      },
      messages: chatWithMessages.messages.map(msg => ({
        id: msg.id,
        requestMessage: msg.requestMessage,
        responseMessages: msg.responseMessages,
        reasoning: msg.reasoning,
        title: msg.title,
        rawLlmMessages: msg.rawLlmMessages,
        finalReasoningMessage: msg.finalReasoningMessage,
        chatId: msg.chatId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        createdBy: msg.createdBy,
        isCompleted: msg.isCompleted,
        feedback: msg.feedback,
      })),
      newMessageId: newMessage.id,
    };

    logger.info('Chat handler completed successfully', {
      chatId: response.chat.id,
      messageId: response.newMessageId,
      executionTimeMs: Date.now() - startTime,
      isNewChat: !request.chat_id,
      hasAssetContext: !!assetContext,
    });

    return response;

  } catch (error) {
    logger.error('Chat handler failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      request: { ...request, userId: '[REDACTED]' },
      executionTimeMs: Date.now() - startTime,
    });

    if (isChatError(error)) {
      throw error;
    }

    throw createChatError('INTERNAL_ERROR', 'An unexpected error occurred');
  }
}

/**
 * Utility functions
 */
function generateMessageTitle(prompt: string): string {
  const maxLength = 50;
  let title = prompt.trim();
  
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  
  return title;
}

function createChatError(code: ChatError['code'], message: string, details?: any): ChatError {
  return {
    code,
    message,
    details,
  };
}

function isChatError(error: any): error is ChatError {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
}
```

## Phase 3: Trigger Integration

### 3.1 Task Trigger Utilities

**File: `src/utils/trigger.ts`**

```typescript
import { tasks } from '@trigger.dev/sdk/v3';
import type { analystagentTask } from '~/trigger/tasks/analyst-agent-task';
import { logger } from './logger';

/**
 * Trigger analyst agent task with error handling and logging
 */
export async function triggerAnalystAgent(messageId: string): Promise<{
  success: boolean;
  taskId?: string;
  error?: string;
}> {
  try {
    const handle = await tasks.trigger<typeof analystagentTask>('analyst-agent-task', {
      message_id: messageId,
    });

    logger.info('Analyst agent task triggered', {
      messageId,
      taskId: handle.id,
    });

    return {
      success: true,
      taskId: handle.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown trigger error';
    
    logger.error('Failed to trigger analyst agent task', {
      messageId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Batch trigger multiple analyst tasks
 */
export async function triggerAnalystAgentBatch(messageIds: string[]): Promise<{
  successful: string[];
  failed: Array<{ messageId: string; error: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ messageId: string; error: string }> = [];

  for (const messageId of messageIds) {
    const result = await triggerAnalystAgent(messageId);
    
    if (result.success) {
      successful.push(messageId);
    } else {
      failed.push({
        messageId,
        error: result.error || 'Unknown error',
      });
    }
  }

  return { successful, failed };
}
```

## Phase 4: Testing Infrastructure

### 4.1 Test Utilities

**File: `src/api/v2/chats/__tests__/test-utils.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';
import {
  createChat,
  createMessage,
} from '@buster/database/helpers';
import type { Chat, Message } from '@buster/database';

export const TEST_USER_ID = 'test-user-' + uuidv4();
export const TEST_ORG_ID = 'test-org-' + uuidv4();

/**
 * Create a test chat for testing
 */
export async function createTestChat(overrides?: Partial<{
  title: string;
  organizationId: string;
  createdBy: string;
}>): Promise<Chat> {
  return createChat({
    title: 'Test Chat',
    organizationId: TEST_ORG_ID,
    createdBy: TEST_USER_ID,
    ...overrides,
  });
}

/**
 * Create a test message for testing
 */
export async function createTestMessage(
  chatId: string,
  overrides?: Partial<{
    requestMessage: string;
    createdBy: string;
  }>
): Promise<Message> {
  return createMessage({
    requestMessage: 'Test message',
    responseMessages: { messages: [] },
    reasoning: { steps: [] },
    title: 'Test Message',
    rawLlmMessages: [],
    chatId,
    createdBy: TEST_USER_ID,
    ...overrides,
  });
}

/**
 * Mock trigger.dev tasks module
 */
export const mockTasks = {
  trigger: vi.fn().mockResolvedValue({ id: 'mock-task-id' }),
};

/**
 * Reset all test data
 */
export async function resetTestData(): Promise<void> {
  // Implementation would clean up test data from database
  // This depends on your test database setup
}
```

### 4.2 Unit Tests

**File: `src/api/v2/chats/__tests__/handler.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createChatHandler } from '../handler';
import { createTestChat, createTestMessage, mockTasks, resetTestData, TEST_USER_ID, TEST_ORG_ID } from './test-utils';
import type { ChatCreateHandlerRequest } from '../../../../types/chat.types';

// Mock the trigger module
vi.mock('@trigger.dev/sdk/v3', () => ({
  tasks: mockTasks,
}));

// Mock asset utilities
vi.mock('../../../../utils/assets', () => ({
  resolveAssetContext: vi.fn().mockResolvedValue({
    assetId: 'test-asset-id',
    assetType: 'metric_file',
    assetName: 'Test Metric',
  }),
  validateAssetAccess: vi.fn().mockResolvedValue(true),
}));

describe('createChatHandler', () => {
  beforeEach(async () => {
    await resetTestData();
    vi.clearAllMocks();
  });

  describe('New Chat Creation', () => {
    it('should create a new chat with message', async () => {
      const request: ChatCreateHandlerRequest = {
        prompt: 'Test prompt for new chat',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      const result = await createChatHandler(request);

      expect(result.chat.title).toContain('Test prompt');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].requestMessage).toBe('Test prompt for new chat');
      expect(result.newMessageId).toBe(result.messages[0].id);
      expect(mockTasks.trigger).toHaveBeenCalledWith('analyst-agent-task', {
        message_id: result.newMessageId,
      });
    });

    it('should create chat with asset context', async () => {
      const request: ChatCreateHandlerRequest = {
        prompt: 'Test prompt with asset',
        asset_id: 'test-asset-id',
        asset_type: 'metric_file',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      const result = await createChatHandler(request);

      expect(result.chat.title).toContain('Metric');
      expect(result.chat.mostRecentFileId).toBe('test-asset-id');
      expect(result.chat.mostRecentFileType).toBe('metric_file');
    });

    it('should throw error when prompt is missing', async () => {
      const request: ChatCreateHandlerRequest = {
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      await expect(createChatHandler(request)).rejects.toThrow('Prompt is required');
    });
  });

  describe('Existing Chat Message Addition', () => {
    it('should add message to existing chat', async () => {
      const existingChat = await createTestChat();
      await createTestMessage(existingChat.id);

      const request: ChatCreateHandlerRequest = {
        prompt: 'New message in existing chat',
        chat_id: existingChat.id,
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      const result = await createChatHandler(request);

      expect(result.chat.id).toBe(existingChat.id);
      expect(result.messages).toHaveLength(2); // Original + new message
      expect(result.messages.some(m => m.requestMessage === 'New message in existing chat')).toBe(true);
    });

    it('should throw error for non-existent chat', async () => {
      const request: ChatCreateHandlerRequest = {
        prompt: 'Message for non-existent chat',
        chat_id: 'non-existent-chat-id',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      await expect(createChatHandler(request)).rejects.toThrow('Chat not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle trigger failures gracefully', async () => {
      mockTasks.trigger.mockRejectedValueOnce(new Error('Trigger failed'));

      const request: ChatCreateHandlerRequest = {
        prompt: 'Test prompt',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      // Should still succeed even if trigger fails
      const result = await createChatHandler(request);
      expect(result.chat).toBeDefined();
      expect(result.messages).toHaveLength(1);
    });

    it('should validate asset access', async () => {
      const { validateAssetAccess } = await import('../../../../utils/assets');
      vi.mocked(validateAssetAccess).mockResolvedValueOnce(false);

      const request: ChatCreateHandlerRequest = {
        prompt: 'Test prompt',
        asset_id: 'test-asset-id',
        asset_type: 'metric_file',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      await expect(createChatHandler(request)).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      const request: ChatCreateHandlerRequest = {
        prompt: 'Performance test prompt',
        userId: TEST_USER_ID,
        organizationId: TEST_ORG_ID,
      };

      await createChatHandler(request);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
```

### 4.3 Integration Tests

**File: `src/api/v2/chats/__tests__/integration.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../../app'; // Your main app instance
import { resetTestData, TEST_USER_ID, TEST_ORG_ID } from './test-utils';

describe('Chat API Integration', () => {
  beforeEach(async () => {
    await resetTestData();
  });

  it('should handle complete chat creation workflow', async () => {
    const response = await request(app)
      .post('/api/v2/chats')
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`)
      .send({
        prompt: 'Integration test prompt',
      })
      .expect(200);

    expect(response.body.chat).toBeDefined();
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.newMessageId).toBeDefined();
  });

  it('should handle asset-based chat creation', async () => {
    const response = await request(app)
      .post('/api/v2/chats')
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`)
      .send({
        prompt: 'Integration test with asset',
        asset_id: 'test-asset-id',
        asset_type: 'metric_file',
      })
      .expect(200);

    expect(response.body.chat.mostRecentFileId).toBe('test-asset-id');
    expect(response.body.chat.mostRecentFileType).toBe('metric_file');
  });

  it('should handle validation errors properly', async () => {
    const response = await request(app)
      .post('/api/v2/chats')
      .set('Authorization', `Bearer ${TEST_USER_TOKEN}`)
      .send({
        asset_id: 'test-asset-id',
        // Missing asset_type - should fail validation
      })
      .expect(400);

    expect(response.body.error).toContain('asset_type must be provided');
  });
});
```

## Phase 5: Response Schema Updates

### 5.1 Route Handler Updates

**File: `src/api/v2/chats/index.ts`**

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createChatHandler } from './handler';
import { 
  ChatCreateRequestSchema, 
  ChatCreateResponseSchema,
  type ChatCreateRequest,
  type ChatCreateHandlerRequest 
} from '../../../types/chat.types';
import { authenticateUser } from '../../../middleware/auth';
import { handleApiError } from '../../../utils/errors';

const chats = new Hono();

// Apply authentication middleware
chats.use('*', authenticateUser);

/**
 * POST /api/v2/chats
 * Create a new chat or add message to existing chat
 */
chats.post(
  '/',
  zValidator('json', ChatCreateRequestSchema),
  async (c) => {
    try {
      const requestData = c.req.valid('json') as ChatCreateRequest;
      const user = c.get('user'); // From auth middleware
      
      // Transform to handler request with user context
      const handlerRequest: ChatCreateHandlerRequest = {
        ...requestData,
        userId: user.id,
        organizationId: user.organizationId,
      };

      const result = await createChatHandler(handlerRequest);
      
      // Validate response schema
      const validatedResponse = ChatCreateResponseSchema.parse(result);
      
      return c.json(validatedResponse);
    } catch (error) {
      return handleApiError(c, error);
    }
  }
);

export default chats;
```

### 5.2 Error Handler Updates

**File: `src/utils/errors.ts`**

```typescript
import type { Context } from 'hono';
import type { ChatError } from '../types/chat.types';
import { logger } from './logger';

/**
 * Handle API errors with proper HTTP status codes and responses
 */
export function handleApiError(c: Context, error: any): Response {
  const requestId = crypto.randomUUID();
  
  logger.error('API Error', {
    requestId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    path: c.req.path,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
  });

  // Handle structured chat errors
  if (isChatError(error)) {
    const statusCode = getChatErrorStatusCode(error.code);
    return c.json({
      error: error.message,
      code: error.code,
      details: error.details,
      requestId,
    }, statusCode);
  }

  // Handle validation errors
  if (error.name === 'ZodError') {
    return c.json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors,
      requestId,
    }, 400);
  }

  // Handle generic errors
  return c.json({
    error: 'An internal error occurred',
    code: 'INTERNAL_ERROR',
    requestId,
  }, 500);
}

function isChatError(error: any): error is ChatError {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
}

function getChatErrorStatusCode(code: ChatError['code']): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'CHAT_NOT_FOUND':
    case 'MESSAGE_NOT_FOUND':
    case 'ASSET_NOT_FOUND':
      return 404;
    case 'PERMISSION_DENIED':
      return 403;
    case 'DATABASE_ERROR':
    case 'TRIGGER_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500;
  }
}
```

## Phase 6: Modular Organization

### 6.1 Service Layer Pattern

**File: `src/services/ChatService.ts`**

```typescript
import type { 
  ChatCreateHandlerRequest, 
  ChatCreateResponse, 
  AssetContext 
} from '../types/chat.types';
import { 
  createChat, 
  getChatWithMessages, 
  updateChat, 
  checkChatAccess, 
  generateChatTitle 
} from '@buster/database/helpers/chats';
import { 
  createPlaceholderMessage 
} from '@buster/database/helpers/messages';
import { 
  resolveAssetContext, 
  validateAssetAccess 
} from '../utils/assets';
import { triggerAnalystAgent } from '../utils/trigger';
import { logger } from '../utils/logger';

export class ChatService {
  /**
   * Create a new chat or add message to existing chat
   */
  async createChatWithMessage(request: ChatCreateHandlerRequest): Promise<ChatCreateResponse> {
    const { assetContext, chatWithMessages, newMessage } = await this.processRequest(request);
    
    // Trigger background processing
    await this.triggerBackgroundProcessing(newMessage.id);
    
    return this.formatResponse(chatWithMessages, newMessage.id);
  }

  /**
   * Process the request and handle chat/message creation
   */
  private async processRequest(request: ChatCreateHandlerRequest) {
    // Resolve asset context
    const assetContext = await this.resolveAssetContext(request);
    
    // Handle existing chat or create new
    if (request.chat_id) {
      return this.addMessageToExistingChat(request, assetContext);
    } else {
      return this.createNewChatWithMessage(request, assetContext);
    }
  }

  /**
   * Resolve asset context if provided
   */
  private async resolveAssetContext(request: ChatCreateHandlerRequest): Promise<AssetContext | null> {
    if (!request.asset_id || !request.asset_type) {
      return null;
    }

    const assetContext = await resolveAssetContext(
      request.asset_id,
      request.asset_type,
      request.organizationId
    );

    if (!assetContext) {
      throw new Error(`Asset not found: ${request.asset_id}`);
    }

    const hasAccess = await validateAssetAccess(
      request.asset_id,
      request.asset_type,
      request.userId,
      request.organizationId
    );

    if (!hasAccess) {
      throw new Error('Insufficient permissions to access asset');
    }

    return assetContext;
  }

  /**
   * Create new chat with initial message
   */
  private async createNewChatWithMessage(
    request: ChatCreateHandlerRequest, 
    assetContext: AssetContext | null
  ) {
    if (!request.prompt) {
      throw new Error('Prompt is required for new chat creation');
    }

    const chatTitle = generateChatTitle(request.prompt, assetContext);
    
    const newChat = await createChat({
      title: chatTitle,
      organizationId: request.organizationId,
      createdBy: request.userId,
    });

    const newMessage = await createPlaceholderMessage({
      requestMessage: request.prompt,
      chatId: newChat.id,
      createdBy: request.userId,
      title: this.generateMessageTitle(request.prompt),
    });

    // Update chat metadata
    await updateChat(
      newChat.id,
      {
        mostRecentFileId: assetContext?.assetId || null,
        mostRecentFileType: assetContext?.assetType || null,
        mostRecentVersionNumber: 1,
      },
      request.userId
    );

    const chatWithMessages = await getChatWithMessages(
      newChat.id,
      request.userId,
      request.organizationId
    );

    if (!chatWithMessages) {
      throw new Error('Failed to retrieve chat after creation');
    }

    return { assetContext, chatWithMessages, newMessage };
  }

  /**
   * Add message to existing chat
   */
  private async addMessageToExistingChat(
    request: ChatCreateHandlerRequest,
    assetContext: AssetContext | null
  ) {
    if (!request.chat_id || !request.prompt) {
      throw new Error('Chat ID and prompt are required for existing chat');
    }

    const hasAccess = await checkChatAccess(
      request.chat_id,
      request.userId,
      request.organizationId
    );

    if (!hasAccess) {
      throw new Error(`Chat not found or access denied: ${request.chat_id}`);
    }

    const newMessage = await createPlaceholderMessage({
      requestMessage: request.prompt,
      chatId: request.chat_id,
      createdBy: request.userId,
      title: this.generateMessageTitle(request.prompt),
    });

    const chatWithMessages = await getChatWithMessages(
      request.chat_id,
      request.userId,
      request.organizationId
    );

    if (!chatWithMessages) {
      throw new Error('Failed to retrieve chat after message creation');
    }

    return { assetContext, chatWithMessages, newMessage };
  }

  /**
   * Trigger background processing
   */
  private async triggerBackgroundProcessing(messageId: string): Promise<void> {
    try {
      const result = await triggerAnalystAgent(messageId);
      
      if (result.success) {
        logger.info('Background processing triggered successfully', {
          messageId,
          taskId: result.taskId,
        });
      } else {
        logger.warn('Background processing trigger failed', {
          messageId,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('Unexpected error triggering background processing', {
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Format the response
   */
  private formatResponse(chatWithMessages: any, newMessageId: string): ChatCreateResponse {
    return {
      chat: {
        id: chatWithMessages.chat.id,
        title: chatWithMessages.chat.title,
        organizationId: chatWithMessages.chat.organizationId,
        createdAt: chatWithMessages.chat.createdAt,
        updatedAt: chatWithMessages.chat.updatedAt,
        createdBy: chatWithMessages.chat.createdBy,
        publiclyAccessible: chatWithMessages.chat.publiclyAccessible,
        mostRecentFileId: chatWithMessages.chat.mostRecentFileId,
        mostRecentFileType: chatWithMessages.chat.mostRecentFileType,
        mostRecentVersionNumber: chatWithMessages.chat.mostRecentVersionNumber,
      },
      messages: chatWithMessages.messages.map((msg: any) => ({
        id: msg.id,
        requestMessage: msg.requestMessage,
        responseMessages: msg.responseMessages,
        reasoning: msg.reasoning,
        title: msg.title,
        rawLlmMessages: msg.rawLlmMessages,
        finalReasoningMessage: msg.finalReasoningMessage,
        chatId: msg.chatId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        createdBy: msg.createdBy,
        isCompleted: msg.isCompleted,
        feedback: msg.feedback,
      })),
      newMessageId,
    };
  }

  /**
   * Generate message title from prompt
   */
  private generateMessageTitle(prompt: string): string {
    const maxLength = 50;
    let title = prompt.trim();
    
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }
    
    return title;
  }
}
```

### 6.2 Updated Handler Using Service

**File: `src/api/v2/chats/handler.ts` (updated)**

```typescript
import { ChatService } from '../../../services/ChatService';
import type { 
  ChatCreateHandlerRequest, 
  ChatCreateResponse 
} from '../../../types/chat.types';

const chatService = new ChatService();

/**
 * Simplified handler using service layer
 */
export async function createChatHandler(
  request: ChatCreateHandlerRequest
): Promise<ChatCreateResponse> {
  return chatService.createChatWithMessage(request);
}
```

## Phase 7: Error Handling & Validation

### 7.1 Comprehensive Error Types

**File: `src/types/errors.ts`**

```typescript
import { z } from 'zod';

// Base error structure
export const BaseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional(),
});

// Chat-specific errors
export const ChatErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'CHAT_NOT_FOUND',
  'MESSAGE_NOT_FOUND',
  'ASSET_NOT_FOUND',
  'PERMISSION_DENIED',
  'DATABASE_ERROR',
  'TRIGGER_ERROR',
  'INTERNAL_ERROR',
  'RATE_LIMIT_EXCEEDED',
  'QUOTA_EXCEEDED',
]);

export const ChatErrorSchema = BaseErrorSchema.extend({
  code: ChatErrorCodeSchema,
});

// Asset-specific errors
export const AssetErrorCodeSchema = z.enum([
  'ASSET_NOT_FOUND',
  'ASSET_ACCESS_DENIED',
  'ASSET_TYPE_MISMATCH',
  'ASSET_DELETED',
  'ASSET_INVALID',
]);

export const AssetErrorSchema = BaseErrorSchema.extend({
  code: AssetErrorCodeSchema,
});

// Inferred types
export type BaseError = z.infer<typeof BaseErrorSchema>;
export type ChatError = z.infer<typeof ChatErrorSchema>;
export type AssetError = z.infer<typeof AssetErrorSchema>;
export type ChatErrorCode = z.infer<typeof ChatErrorCodeSchema>;
export type AssetErrorCode = z.infer<typeof AssetErrorCodeSchema>;
```

### 7.2 Error Factory

**File: `src/utils/error-factory.ts`**

```typescript
import type { ChatError, AssetError, ChatErrorCode, AssetErrorCode } from '../types/errors';

export class ErrorFactory {
  static createChatError(
    code: ChatErrorCode,
    message: string,
    details?: Record<string, any>
  ): ChatError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
  }

  static createAssetError(
    code: AssetErrorCode,
    message: string,
    details?: Record<string, any>
  ): AssetError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
  }

  // Common error scenarios
  static chatNotFound(chatId: string): ChatError {
    return this.createChatError(
      'CHAT_NOT_FOUND',
      `Chat not found or access denied`,
      { chatId }
    );
  }

  static assetNotFound(assetId: string, assetType: string): AssetError {
    return this.createAssetError(
      'ASSET_NOT_FOUND',
      `Asset not found: ${assetType}`,
      { assetId, assetType }
    );
  }

  static permissionDenied(resource: string, action: string): ChatError {
    return this.createChatError(
      'PERMISSION_DENIED',
      `Insufficient permissions to ${action} ${resource}`,
      { resource, action }
    );
  }

  static validationError(field: string, reason: string): ChatError {
    return this.createChatError(
      'VALIDATION_ERROR',
      `Validation failed for ${field}: ${reason}`,
      { field, reason }
    );
  }
}
```

### 7.3 Validation Middleware

**File: `src/middleware/validation.ts`**

```typescript
import type { Context, Next } from 'hono';
import { z } from 'zod';
import { ErrorFactory } from '../utils/error-factory';
import { logger } from '../utils/logger';

/**
 * Create validation middleware for request bodies
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set('validatedBody', validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          path: c.req.path,
          method: c.req.method,
          errors: validationDetails,
        });

        const chatError = ErrorFactory.createChatError(
          'VALIDATION_ERROR',
          'Request validation failed',
          { validationErrors: validationDetails }
        );

        return c.json(chatError, 400);
      }

      throw error;
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      c.set('validatedQuery', validatedQuery);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const chatError = ErrorFactory.createChatError(
          'VALIDATION_ERROR',
          'Query parameter validation failed',
          { validationErrors: error.errors }
        );

        return c.json(chatError, 400);
      }

      throw error;
    }
  };
}
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Phase 1: Type System & Database Foundation
- [ ] Set up enhanced type definitions
- [ ] Create database helper modules
- [ ] Update existing database helpers

### Week 2: Core Implementation
- [ ] Phase 2: Core Handler Implementation
- [ ] Implement asset integration module
- [ ] Create enhanced handler with full functionality
- [ ] Implement service layer pattern

### Week 3: Integration & Testing
- [ ] Phase 3: Trigger Integration
- [ ] Set up trigger utilities
- [ ] Phase 4: Testing Infrastructure
- [ ] Create comprehensive test suites
- [ ] Set up integration tests

### Week 4: Polish & Deployment
- [ ] Phase 5: Response Schema Updates
- [ ] Update route handlers and error handling
- [ ] Phase 6: Modular Organization
- [ ] Refactor into service pattern
- [ ] Phase 7: Error Handling & Validation
- [ ] Implement comprehensive error handling
- [ ] Add validation middleware

## File Structure Summary

```
server/src/
├── api/v2/chats/
│   ├── handler.ts                 # Main chat handler (updated)
│   ├── index.ts                   # Route definitions (updated)
│   ├── IMPLEMENTATION.md          # This guide
│   └── __tests__/
│       ├── handler.test.ts        # Unit tests
│       ├── integration.test.ts    # Integration tests
│       └── test-utils.ts          # Test utilities
├── services/
│   └── ChatService.ts             # Service layer implementation
├── types/
│   ├── chat.types.ts              # Enhanced chat types
│   └── errors.ts                  # Error type definitions
├── middleware/
│   └── validation.ts              # Validation middleware
└── utils/
    ├── assets.ts                  # Asset integration utilities
    ├── trigger.ts                 # Trigger.dev utilities
    ├── error-factory.ts           # Error creation utilities
    └── errors.ts                  # Error handling utilities

packages/database/src/helpers/
├── chats.ts                       # Chat database helpers (new)
└── messages.ts                    # Message helpers (enhanced)
```

## Key Implementation Notes

1. **Gradual Migration**: The implementation can be done incrementally, starting with the basic functionality and adding features phase by phase.

2. **Error Handling**: Comprehensive error handling ensures robust operation and good user experience.

3. **Testing**: Unit and integration tests provide confidence in the implementation and help catch regressions.

4. **Modularity**: The service layer pattern makes the code more maintainable and testable.

5. **Performance**: Background processing via Trigger.dev ensures fast response times for users.

6. **Type Safety**: Comprehensive TypeScript types and Zod validation ensure runtime safety.

7. **Observability**: Structured logging throughout the implementation aids in debugging and monitoring.

This implementation guide provides a complete roadmap for building a robust, production-ready chat handler system. Each phase builds upon the previous one, allowing for incremental development and testing.