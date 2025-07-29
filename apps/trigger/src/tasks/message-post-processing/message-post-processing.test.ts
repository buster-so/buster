import postProcessingWorkflow from '@buster/ai/workflows/post-processing-workflow';
import * as database from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as helpers from './helpers';
import { messagePostProcessingTask } from './message-post-processing';
import { DataFetchError, MessageNotFoundError } from './types';

// Extract the run function from the task
const runTask = (messagePostProcessingTask as any).run;

// Mock dependencies
vi.mock('./helpers', () => ({
  fetchMessageWithContext: vi.fn(),
  fetchPreviousPostProcessingMessages: vi.fn(),
  fetchUserDatasets: vi.fn(),
  buildWorkflowInput: vi.fn(),
  validateMessageId: vi.fn((id) => id),
  validateWorkflowOutput: vi.fn((output) => output),
  getExistingSlackMessageForChat: vi.fn(),
  sendSlackNotification: vi.fn(),
  sendSlackReplyNotification: vi.fn(),
  trackSlackNotification: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  messages: { id: 'messages.id', postProcessingMessage: 'messages.postProcessingMessage' },
  slackIntegrations: {
    id: 'slackIntegrations.id',
    tokenVaultKey: 'slackIntegrations.tokenVaultKey',
  },
  getBraintrustMetadata: vi.fn(() =>
    Promise.resolve({
      userName: 'John Doe',
      userId: 'user-123',
      organizationName: 'Test Org',
      organizationId: 'org-123',
      messageId: 'msg-12345',
      chatId: 'chat-123',
    })
  ),
}));

vi.mock('@buster/ai/workflows/post-processing-workflow', () => ({
  default: {
    createRun: vi.fn(),
  },
}));

// Mock Trigger.dev logger
vi.mock('@trigger.dev/sdk/v3', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
  schemaTask: vi.fn((config) => ({
    ...config,
    run: config.run,
  })),
}));

// Mock Braintrust
vi.mock('braintrust', () => ({
  initLogger: vi.fn(() => ({
    flush: vi.fn().mockResolvedValue(undefined),
  })),
  currentSpan: vi.fn(() => ({
    log: vi.fn(),
  })),
  wrapTraced: vi.fn((fn) => fn),
}));

describe('messagePostProcessingTask', () => {
  let mockDb: any;
  let mockWorkflowRun: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock BRAINTRUST_KEY for unit tests
    vi.stubEnv('BRAINTRUST_KEY', 'test-braintrust-key');
    mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };

    // Default mock chain behavior
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockResolvedValue([{ tokenVaultKey: 'vault-key-123' }]);
    mockDb.orderBy.mockResolvedValue([]);

    vi.mocked(database.getDb).mockReturnValue(mockDb);

    // Setup workflow mock
    mockWorkflowRun = {
      start: vi.fn(),
    };
    vi.mocked(postProcessingWorkflow.createRun).mockReturnValue(mockWorkflowRun);
  });

  it('should process message successfully for initial message', async () => {
    const messageId = '123e4567-e89b-12d3-a456-426614174000';
    const messageContext = {
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      rawLlmMessages: [{ role: 'user', content: 'Hello' }] as any,
      userName: 'John Doe',
      organizationId: 'org-123',
    };

    const conversationMessages = [
      {
        id: '1',
        rawLlmMessages: [{ role: 'user' as const, content: 'Hello' }],
        createdAt: new Date(),
      },
    ];

    const workflowOutput = {
      'format-initial-message': {
        assumptions: [
          {
            descriptiveTitle: 'Test assumption',
            classification: 'business_rules',
            explanation: 'Test explanation',
            label: 'important',
          },
        ],
        flagChatMessage: false,
        toolCalled: false,
        summaryTitle: 'Test Summary',
        summaryMessage: 'Test summary message',
      },
    };

    // Setup mocks
    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue(messageContext);
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue({
      datasets: [],
      total: 0,
      page: 0,
      pageSize: 1000,
    });
    vi.mocked(helpers.getExistingSlackMessageForChat).mockResolvedValue({ exists: false });
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: [{ role: 'user', content: 'Hello' }],
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: '',
    });
    mockWorkflowRun.start.mockResolvedValue({
      status: 'success',
      result: workflowOutput,
    });

    // Execute task
    const result = await runTask({ messageId });

    // Verify results
    expect(result).toEqual({
      success: true,
      messageId,
      result: {
        success: true,
        messageId,
        executionTimeMs: expect.any(Number),
        workflowCompleted: true,
      },
    });
    expect(helpers.fetchMessageWithContext).toHaveBeenCalledWith(messageId);
    expect(helpers.fetchPreviousPostProcessingMessages).toHaveBeenCalledWith(
      'chat-123',
      messageContext.createdAt
    );
    expect(helpers.fetchUserDatasets).toHaveBeenCalledWith('user-123');
    expect(postProcessingWorkflow.createRun).toHaveBeenCalled();
    expect(mockWorkflowRun.start).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalledWith(database.messages);
    expect(mockDb.set).toHaveBeenCalledWith({
      postProcessingMessage: {
        summary_message: 'Test summary message',
        summary_title: 'Test Summary',
        confidence_score: 'high',
        assumptions: [
          {
            descriptive_title: 'Test assumption',
            classification: 'business_rules',
            explanation: 'Test explanation',
            label: 'important',
          },
        ],
        tool_called: 'unknown',
        user_name: 'John Doe',
      },
      updatedAt: expect.any(String),
    });
  });

  it('should process follow-up message correctly', async () => {
    const messageId = '123e4567-e89b-12d3-a456-426614174000';
    const previousResults = [
      {
        postProcessingMessage: { assumptions: ['Previous assumption'] },
        createdAt: new Date(),
      },
    ];

    const workflowOutput = {
      'format-follow-up-message': {
        assumptions: [],
        flagChatMessage: false,
        toolCalled: false,
        summaryTitle: 'Follow-up Analysis',
        summaryMessage: 'Based on previous conversation...',
        followUpSuggestions: ['Ask about X'],
      },
    };

    // Setup mocks for follow-up scenario
    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue({
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      rawLlmMessages: [] as any,
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue(previousResults);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue({
      datasets: [],
      total: 0,
      page: 0,
      pageSize: 1000,
    });
    vi.mocked(helpers.getExistingSlackMessageForChat).mockResolvedValue({
      exists: true,
      slackMessageTs: 'ts-123',
      slackThreadTs: 'thread-ts-123',
      channelId: 'C123456',
      integrationId: 'int-123',
    });
    vi.mocked(helpers.sendSlackReplyNotification).mockResolvedValue({
      sent: true,
      messageTs: 'msg-ts-456',
      threadTs: 'thread-ts-456',
      integrationId: 'int-123',
      channelId: 'C123456',
    });
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: true,
      isSlackFollowUp: true,
      previousMessages: ['{"assumptions":["Previous assumption"]}'],
      datasets: '',
    });
    mockWorkflowRun.start.mockResolvedValue({
      status: 'success',
      result: workflowOutput,
    });

    const result = await runTask({ messageId });

    expect(result).toEqual({
      success: true,
      messageId,
      result: {
        success: true,
        messageId,
        executionTimeMs: expect.any(Number),
        workflowCompleted: true,
      },
    });
    expect(helpers.buildWorkflowInput).toHaveBeenCalledWith(
      expect.objectContaining({ id: messageId }),
      previousResults,
      [],
      true
    );
  });

  it('should return error result when workflow returns no output', async () => {
    const messageId = '123e4567-e89b-12d3-a456-426614174000';

    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue({
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      rawLlmMessages: [] as any,
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue({
      datasets: [],
      total: 0,
      page: 0,
      pageSize: 1000,
    });
    vi.mocked(helpers.getExistingSlackMessageForChat).mockResolvedValue({ exists: false });
    vi.mocked(helpers.sendSlackNotification).mockResolvedValue({
      sent: true,
      messageTs: 'msg-ts-123',
      threadTs: 'thread-ts-123',
      integrationId: 'int-123',
      channelId: 'C123456',
    });
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: '',
    });
    mockWorkflowRun.start.mockResolvedValue({
      status: 'failed',
      result: null,
    });

    const result = await runTask({ messageId });

    expect(result).toEqual({
      success: false,
      messageId,
      error: {
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: 'Post-processing workflow returned no output',
        details: {
          operation: 'message_post_processing_task_execution',
          messageId,
        },
      },
    });
  });

  it('should return error result for message not found', async () => {
    const messageId = 'non-existent-id';
    const error = new MessageNotFoundError(messageId);

    vi.mocked(helpers.fetchMessageWithContext).mockRejectedValue(error);

    const result = await runTask({ messageId });

    expect(result).toEqual({
      success: false,
      messageId,
      error: {
        code: 'MESSAGE_NOT_FOUND',
        message: `Message not found: ${messageId}`,
        details: {
          operation: 'message_post_processing_task_execution',
          messageId,
        },
      },
    });
  });

  it('should return error result for database update failure', async () => {
    const messageId = '123e4567-e89b-12d3-a456-426614174000';
    const dbError = new Error('Database update failed');

    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue({
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      rawLlmMessages: [] as any,
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue({
      datasets: [],
      total: 0,
      page: 0,
      pageSize: 1000,
    });
    vi.mocked(helpers.getExistingSlackMessageForChat).mockResolvedValue({ exists: false });
    vi.mocked(helpers.sendSlackNotification).mockResolvedValue({
      sent: true,
      messageTs: 'msg-ts-123',
      threadTs: 'thread-ts-123',
      integrationId: 'int-123',
      channelId: 'C123456',
    });
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: '',
    });
    mockWorkflowRun.start.mockResolvedValue({
      status: 'success',
      result: {
        'format-initial-message': {
          assumptions: [],
          flagChatMessage: false,
          toolCalled: false,
          summaryTitle: 'Summary',
          summaryMessage: 'Summary message',
        },
      },
    });
    mockDb.where.mockRejectedValue(dbError);

    const result = await runTask({ messageId });

    expect(result).toEqual({
      success: false,
      messageId,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database update failed: Database update failed',
        details: {
          operation: 'message_post_processing_task_execution',
          messageId,
        },
      },
    });
  });
});
