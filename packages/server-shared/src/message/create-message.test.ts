import { describe, expect, it } from 'vitest';
import {
  CreateMessageRequestBodySchema,
  CreateMessageRequestParamsSchema,
  CreateMessageResponseSchema,
} from './create-message';

describe('CreateMessageRequestParamsSchema', () => {
  it('should validate valid params', () => {
    const validParams = {
      chatId: '123e4567-e89b-12d3-a456-426614174000',
      messageId: '223e4567-e89b-12d3-a456-426614174001',
    };

    const result = CreateMessageRequestParamsSchema.safeParse(validParams);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chatId).toBe(validParams.chatId);
      expect(result.data.messageId).toBe(validParams.messageId);
    }
  });

  it('should reject invalid chatId format', () => {
    const invalidParams = {
      chatId: 'not-a-uuid',
      messageId: '223e4567-e89b-12d3-a456-426614174001',
    };

    const result = CreateMessageRequestParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject invalid messageId format', () => {
    const invalidParams = {
      chatId: '123e4567-e89b-12d3-a456-426614174000',
      messageId: 'not-a-uuid',
    };

    const result = CreateMessageRequestParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject missing chatId', () => {
    const invalidParams = {
      messageId: '223e4567-e89b-12d3-a456-426614174001',
    };

    const result = CreateMessageRequestParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should reject missing messageId', () => {
    const invalidParams = {
      chatId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = CreateMessageRequestParamsSchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });
});

describe('CreateMessageRequestBodySchema', () => {
  it('should validate valid body with prompt', () => {
    const validBody = {
      prompt: 'What is the sales trend for Q4?',
    };

    const result = CreateMessageRequestBodySchema.safeParse(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prompt).toBe(validBody.prompt);
    }
  });

  it('should reject empty prompt', () => {
    const invalidBody = {
      prompt: '',
    };

    const result = CreateMessageRequestBodySchema.safeParse(invalidBody);
    expect(result.success).toBe(false);
  });

  it('should reject missing prompt', () => {
    const invalidBody = {};

    const result = CreateMessageRequestBodySchema.safeParse(invalidBody);
    expect(result.success).toBe(false);
  });
});

describe('CreateMessageResponseSchema', () => {
  it('should validate valid response', () => {
    const validResponse = {
      success: true,
      chatId: '123e4567-e89b-12d3-a456-426614174000',
      messageId: '223e4567-e89b-12d3-a456-426614174001',
      chat: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Chat',
        is_favorited: false,
        message_ids: ['223e4567-e89b-12d3-a456-426614174001'],
        messages: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: 'user-123',
        created_by_id: 'user-123',
        created_by_name: 'Test User',
        created_by_avatar: null,
        screenshot_taken_at: null,
        publicly_accessible: false,
        public_expiry_date: null,
        public_password: null,
        workspace_sharing: 'none',
        individual_permissions: [],
        permission: 'owner',
      },
    };

    const result = CreateMessageResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(true);
      expect(result.data.chatId).toBe(validResponse.chatId);
      expect(result.data.messageId).toBe(validResponse.messageId);
    }
  });

  it('should reject response with invalid chatId', () => {
    const invalidResponse = {
      success: true,
      chatId: 'not-a-uuid',
      messageId: '223e4567-e89b-12d3-a456-426614174001',
      chat: {},
    };

    const result = CreateMessageResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it('should reject response with missing required fields', () => {
    const invalidResponse = {
      success: true,
      chatId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = CreateMessageResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});
