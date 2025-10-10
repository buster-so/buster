import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../types/hono.types';
import { ChatError, ChatErrorCode, type ChatWithMessages } from '@buster/server-shared/chats';
import chatRoutes from './index';

vi.mock('@buster/database/connection', () => ({
  initializePool: vi.fn().mockReturnValue({}),
  getPool: vi.fn().mockReturnValue({}),
}));

// Mock dependencies
vi.mock('../../../middleware/auth', () => ({
  requireAuth: vi.fn((_c, next) => next()),
}));

vi.mock('./handler', () => ({
  createChatHandler: vi.fn(),
}));

// Import mocked handler
import { createChatHandler } from './handler';

// Test helper to create request
async function makeRequest(app: Hono, body: any, headers: Record<string, string> = {}) {
  const request = new Request('http://localhost/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  return app.request(request);
}

describe('POST /chats', () => {
  let app: Hono;
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockChat: ChatWithMessages = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Chat',
    is_favorited: false,
    message_ids: ['123e4567-e89b-12d3-a456-426614174001'],
    messages: {
      '123e4567-e89b-12d3-a456-426614174001': {
        id: '123e4567-e89b-12d3-a456-426614174001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        request_message: {
          request: 'Hello',
          sender_id: '123e4567-e89b-12d3-a456-426614174002',
          sender_name: 'Test User',
        },
        response_messages: {},
        response_message_ids: [],
        reasoning_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: null,
        feedback: null,

        is_completed: false,
      },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: '123e4567-e89b-12d3-a456-426614174002',
    created_by_id: '123e4567-e89b-12d3-a456-426614174002',
    created_by_name: 'Test User',
    created_by_avatar: null,
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

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();

    // Mock user context
    app.use('*', async (c, next) => {
      c.set('busterUser', mockUser);
      await next();
    });

    app.route('/chats', chatRoutes);

    vi.mocked(createChatHandler).mockResolvedValue(mockChat);
  });

  it('should create a chat with valid request', async () => {
    const response = await makeRequest(app, {
      prompt: 'Hello world',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockChat);
    expect(createChatHandler).toHaveBeenCalledWith(
      { prompt: 'Hello world' },
      mockUser,
      expect.anything()
    );
  });

  it('should create a chat with existing chat_id', async () => {
    const response = await makeRequest(app, {
      chat_id: '123e4567-e89b-12d3-a456-426614174003',
      prompt: 'Follow up message',
    });

    expect(response.status).toBe(200);
    expect(createChatHandler).toHaveBeenCalledWith(
      { chat_id: '123e4567-e89b-12d3-a456-426614174003', prompt: 'Follow up message' },
      mockUser,
      expect.anything()
    );
  });

  it('should create asset-based chat', async () => {
    const response = await makeRequest(app, {
      asset_id: '123e4567-e89b-12d3-a456-426614174004',
      asset_type: 'metric_file',
    });

    expect(response.status).toBe(200);
    expect(createChatHandler).toHaveBeenCalledWith(
      { asset_id: '123e4567-e89b-12d3-a456-426614174004', asset_type: 'metric_file' },
      mockUser,
      expect.anything()
    );
  });

  it('should validate asset_type is required when asset_id is provided', async () => {
    const response = await makeRequest(app, {
      asset_id: '123e4567-e89b-12d3-a456-426614174005',
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    // Zod validation errors have a different structure
    expect((data as any).error || (data as any).message || (data as any).errors).toBeDefined();
  });

  it.skip('should handle ChatError with proper status code', async () => {
    const chatError = new ChatError(ChatErrorCode.PERMISSION_DENIED, 'Access denied', 403);
    vi.mocked(createChatHandler).mockRejectedValue(chatError.toResponse());

    const response = await makeRequest(app, { prompt: 'Hello' });
    expect(createChatHandler).toHaveBeenCalledWith(
      { prompt: 'Hello' },
      mockUser,
      expect.anything()
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({
      error: {
        code: ChatErrorCode.PERMISSION_DENIED,
        message: 'Access denied',
      },
    });
  });

  it.skip('should handle unexpected errors with 500 status', async () => {
    vi.mocked(createChatHandler).mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await makeRequest(app, { prompt: 'Hello' });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({
      error: {
        message: 'Failed to create chat',
      },
    });

    consoleSpy.mockRestore();
  });

  it('should handle empty request body', async () => {
    const response = await makeRequest(app, {});

    expect(response.status).toBe(200);
    expect(createChatHandler).toHaveBeenCalledWith({}, mockUser, expect.anything());
  });

  it('should support legacy fields', async () => {
    const response = await makeRequest(app, {
      metric_id: '123e4567-e89b-12d3-a456-426614174006',
      dashboard_id: '123e4567-e89b-12d3-a456-426614174007',
    });

    expect(response.status).toBe(200);
    // Handler should receive the request but won't use legacy fields
    expect(createChatHandler).toHaveBeenCalledWith(
      expect.objectContaining({}),
      mockUser,
      expect.anything()
    );
  });
});
