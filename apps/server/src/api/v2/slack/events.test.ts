import { db } from '@buster/database/connection';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventsHandler, findOrCreateSlackChat } from './events';

vi.mock('@buster/database/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@buster/database/schema', () => ({
  chats: {},
  slackIntegrations: {},
}));

vi.mock('@buster/database/queries', () => ({
  getSecretByName: vi.fn(),
}));

vi.mock('@buster/slack', () => ({
  SlackMessagingService: vi.fn(() => ({
    sendMessage: vi.fn(),
  })),
  isEventCallback: vi.fn(),
  isAppMentionEvent: vi.fn(),
  isMessageImEvent: vi.fn(),
  addReaction: vi.fn(),
}));

vi.mock('@trigger.dev/sdk', () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

vi.mock('./services/slack-authentication', () => ({
  authenticateSlackUser: vi.fn(),
  getUserIdFromAuthResult: vi.fn(),
}));

describe('findOrCreateSlackChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a chat with workspace sharing when Slack integration has shareWithWorkspace', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ defaultSharingPermissions: 'shareWithWorkspace' }]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'can_view',
      workspaceSharingEnabledBy: 'user-123',
      workspaceSharingEnabledAt: expect.any(String),
    });
  });

  it('should create a chat without workspace sharing when Slack integration has different setting', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ defaultSharingPermissions: 'shareWithChannel' }]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'none',
      workspaceSharingEnabledBy: null,
      workspaceSharingEnabledAt: null,
    });
  });

  it('should return existing chat if found', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query - chat exists
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ id: 'existing-chat-id' }]),
        } as any;
      }
      // Mock for slack integration query (won't be used due to early return)
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any;
    });

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('existing-chat-id');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('should create chat without workspace sharing when no Slack integration found', async () => {
    // Mock implementations need to handle being called twice
    let selectCallCount = 0;

    vi.mocked(db.select).mockImplementation(() => {
      selectCallCount++;

      // First call is for existing chat, second is for slack integration
      if (selectCallCount === 1) {
        // Mock for existing chat query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        } as any;
      }
      // Mock for slack integration query - no integration found
      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any;
    });

    // Mock insert
    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-chat-id' }]),
    };
    vi.mocked(db.insert).mockReturnValue(mockInsert as any);

    const result = await findOrCreateSlackChat({
      threadTs: 'thread-123',
      channelId: 'channel-123',
      organizationId: 'org-123',
      userId: 'user-123',
      slackChatAuthorization: 'authorized',
      teamId: 'team-123',
    });

    expect(result).toBe('new-chat-id');
    expect(mockInsert.values).toHaveBeenCalledWith({
      title: '',
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      slackChatAuthorization: 'authorized',
      slackThreadTs: 'thread-123',
      slackChannelId: 'channel-123',
      workspaceSharing: 'none',
      workspaceSharingEnabledBy: null,
      workspaceSharingEnabledAt: null,
    });
  });
});

describe('eventsHandler - Unauthorized Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success without sending message for bot unauthorized users', async () => {
    const { isEventCallback, isAppMentionEvent, isMessageImEvent } = await import('@buster/slack');
    const { authenticateSlackUser } = await import('./services/slack-authentication');

    // Mock event callback detection
    vi.mocked(isEventCallback).mockReturnValue(true);
    vi.mocked(isAppMentionEvent).mockReturnValue(true);
    vi.mocked(isMessageImEvent).mockReturnValue(false);

    // Mock authentication to return unauthorized bot
    vi.mocked(authenticateSlackUser).mockResolvedValue({
      type: 'unauthorized',
      reason: 'User is a bot account',
    } as any);

    const payload = {
      type: 'event_callback' as const,
      token: 'xoxb-test-token',
      team_id: 'T123456',
      api_app_id: 'A123456',
      event_id: 'E123456',
      event_time: 1234567890,
      event: {
        type: 'app_mention' as const,
        user: 'U123456',
        channel: 'C123456',
        text: 'Hello Buster',
        ts: '1234567890.123456',
        event_ts: '1234567890.123456',
      },
    };

    const result = await eventsHandler(payload);

    expect(result).toEqual({ success: true });
    expect(authenticateSlackUser).toHaveBeenCalledWith('U123456', 'T123456');

    // Should not attempt to send message or get access token
    expect(db.select).not.toHaveBeenCalled();
  });

  it('should send unauthorized message for regular unauthorized users', async () => {
    const { isEventCallback, isAppMentionEvent, isMessageImEvent, SlackMessagingService } =
      await import('@buster/slack');
    const { authenticateSlackUser } = await import('./services/slack-authentication');
    const { getSecretByName } = await import('@buster/database/queries');

    // Mock event callback detection
    vi.mocked(isEventCallback).mockReturnValue(true);
    vi.mocked(isAppMentionEvent).mockReturnValue(true);
    vi.mocked(isMessageImEvent).mockReturnValue(false);

    // Mock authentication to return unauthorized (non-bot)
    vi.mocked(authenticateSlackUser).mockResolvedValue({
      type: 'unauthorized',
      reason: 'User email not found in organization domain',
    } as any);

    // Mock database query for getting access token
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ tokenVaultKey: 'vault-key-123' }]),
    } as any);

    // Mock vault secret
    vi.mocked(getSecretByName).mockResolvedValue({
      secret: 'xoxb-test-token',
    } as any);

    // Mock messaging service
    const mockSendMessage = vi.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });
    vi.mocked(SlackMessagingService).mockImplementation(function (this: any) {
      this.sendMessage = mockSendMessage;
      return this;
    });

    const payload = {
      type: 'event_callback' as const,
      token: 'xoxb-test-token',
      team_id: 'T123456',
      api_app_id: 'A123456',
      event_id: 'E123456',
      event_time: 1234567890,
      event: {
        type: 'app_mention' as const,
        user: 'U123456',
        channel: 'C123456',
        text: 'Hello Buster',
        ts: '1234567890.123456',
        event_ts: '1234567890.123456',
      },
    };

    await expect(eventsHandler(payload)).rejects.toThrow(
      'Unauthorized: Slack user authentication failed'
    );

    expect(authenticateSlackUser).toHaveBeenCalledWith('U123456', 'T123456');
    expect(getSecretByName).toHaveBeenCalledWith('vault-key-123');
    expect(mockSendMessage).toHaveBeenCalledWith('xoxb-test-token', 'C123456', {
      text: 'Sorry, you are unauthorized to chat with Buster. Please contact your Workspace Administrator for access.',
      thread_ts: '1234567890.123456',
    });
  });

  it('should send unauthorized message in thread for DM unauthorized users', async () => {
    const { isEventCallback, isAppMentionEvent, isMessageImEvent, SlackMessagingService } =
      await import('@buster/slack');
    const { authenticateSlackUser } = await import('./services/slack-authentication');
    const { getSecretByName } = await import('@buster/database/queries');

    // Mock event callback detection - this time it's a DM
    vi.mocked(isEventCallback).mockReturnValue(true);
    vi.mocked(isAppMentionEvent).mockReturnValue(false);
    vi.mocked(isMessageImEvent).mockReturnValue(true);

    // Mock authentication to return unauthorized
    vi.mocked(authenticateSlackUser).mockResolvedValue({
      type: 'unauthorized',
      reason: 'User not found in organization',
    } as any);

    // Mock database query for getting access token
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ tokenVaultKey: 'vault-key-123' }]),
    } as any);

    // Mock vault secret
    vi.mocked(getSecretByName).mockResolvedValue({
      secret: 'xoxb-test-token',
    } as any);

    // Mock messaging service
    const mockSendMessage = vi.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });
    vi.mocked(SlackMessagingService).mockImplementation(function (this: any) {
      this.sendMessage = mockSendMessage;
      return this;
    });

    const payload = {
      type: 'event_callback' as const,
      token: 'xoxb-test-token',
      team_id: 'T123456',
      api_app_id: 'A123456',
      event_id: 'E123456',
      event_time: 1234567890,
      event: {
        type: 'message' as const,
        channel_type: 'im' as const,
        user: 'U123456',
        channel: 'D123456',
        text: 'Hello Buster',
        ts: '1234567890.123456',
        event_ts: '1234567890.123456',
        thread_ts: '1234567890.111111', // This is a threaded message
      },
    };

    await expect(eventsHandler(payload)).rejects.toThrow(
      'Unauthorized: Slack user authentication failed'
    );

    expect(authenticateSlackUser).toHaveBeenCalledWith('U123456', 'T123456');
    expect(getSecretByName).toHaveBeenCalledWith('vault-key-123');
    expect(mockSendMessage).toHaveBeenCalledWith('xoxb-test-token', 'D123456', {
      text: 'Sorry, you are unauthorized to chat with Buster. Please contact your Workspace Administrator for access.',
      thread_ts: '1234567890.111111', // Should use the existing thread_ts
    });
  });

  it('should handle failure to send unauthorized message gracefully', async () => {
    const { isEventCallback, isAppMentionEvent, isMessageImEvent, SlackMessagingService } =
      await import('@buster/slack');
    const { authenticateSlackUser } = await import('./services/slack-authentication');
    const { getSecretByName } = await import('@buster/database/queries');

    // Mock event callback detection
    vi.mocked(isEventCallback).mockReturnValue(true);
    vi.mocked(isAppMentionEvent).mockReturnValue(true);
    vi.mocked(isMessageImEvent).mockReturnValue(false);

    // Mock authentication to return unauthorized
    vi.mocked(authenticateSlackUser).mockResolvedValue({
      type: 'unauthorized',
      reason: 'User not authorized',
    } as any);

    // Mock database query for getting access token
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ tokenVaultKey: 'vault-key-123' }]),
    } as any);

    // Mock vault secret
    vi.mocked(getSecretByName).mockResolvedValue({
      secret: 'xoxb-test-token',
    } as any);

    // Mock messaging service to throw error
    const mockSendMessage = vi.fn().mockRejectedValue(new Error('Slack API error'));
    vi.mocked(SlackMessagingService).mockImplementation(function (this: any) {
      this.sendMessage = mockSendMessage;
      return this;
    });

    const payload = {
      type: 'event_callback' as const,
      token: 'xoxb-test-token',
      team_id: 'T123456',
      api_app_id: 'A123456',
      event_id: 'E123456',
      event_time: 1234567890,
      event: {
        type: 'app_mention' as const,
        user: 'U123456',
        channel: 'C123456',
        text: 'Hello Buster',
        ts: '1234567890.123456',
        event_ts: '1234567890.123456',
      },
    };

    // Should still throw the unauthorized error even if message sending fails
    await expect(eventsHandler(payload)).rejects.toThrow(
      'Unauthorized: Slack user authentication failed'
    );

    expect(authenticateSlackUser).toHaveBeenCalledWith('U123456', 'T123456');
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it('should handle case when no access token is available for unauthorized message', async () => {
    const { isEventCallback, isAppMentionEvent, isMessageImEvent, SlackMessagingService } =
      await import('@buster/slack');
    const { authenticateSlackUser } = await import('./services/slack-authentication');
    const { getSecretByName } = await import('@buster/database/queries');

    // Mock event callback detection
    vi.mocked(isEventCallback).mockReturnValue(true);
    vi.mocked(isAppMentionEvent).mockReturnValue(true);
    vi.mocked(isMessageImEvent).mockReturnValue(false);

    // Mock authentication to return unauthorized
    vi.mocked(authenticateSlackUser).mockResolvedValue({
      type: 'unauthorized',
      reason: 'User not authorized',
    } as any);

    // Mock database query to return empty result (no token found)
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as any);

    // Mock messaging service (shouldn't be called)
    const mockSendMessage = vi.fn();
    vi.mocked(SlackMessagingService).mockImplementation(function (this: any) {
      this.sendMessage = mockSendMessage;
      return this;
    });

    const payload = {
      type: 'event_callback' as const,
      token: 'xoxb-test-token',
      team_id: 'T123456',
      api_app_id: 'A123456',
      event_id: 'E123456',
      event_time: 1234567890,
      event: {
        type: 'app_mention' as const,
        user: 'U123456',
        channel: 'C123456',
        text: 'Hello Buster',
        ts: '1234567890.123456',
        event_ts: '1234567890.123456',
      },
    };

    // Should still throw the unauthorized error even when no token is available
    await expect(eventsHandler(payload)).rejects.toThrow(
      'Unauthorized: Slack user authentication failed'
    );

    expect(authenticateSlackUser).toHaveBeenCalledWith('U123456', 'T123456');
    expect(getSecretByName).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
