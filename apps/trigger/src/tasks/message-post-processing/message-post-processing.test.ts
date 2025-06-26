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
  fetchConversationHistory: vi.fn(),
  fetchPreviousPostProcessingMessages: vi.fn(),
  fetchUserDatasets: vi.fn(),
  buildWorkflowInput: vi.fn(),
  validateMessageId: vi.fn((id) => id),
  validateWorkflowOutput: vi.fn((output) => output),
}));

vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  messages: { id: 'messages.id' },
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

describe('messagePostProcessingTask', () => {
  let mockDb: any;
  let mockWorkflowRun: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
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
      initial: {
        assumptions: ['Test assumption'],
        flagForReview: false,
      },
    };

    // Setup mocks
    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue(messageContext);
    vi.mocked(helpers.fetchConversationHistory).mockResolvedValue(conversationMessages);
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue([]);
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: [{ role: 'user', content: 'Hello' }],
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
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
    expect(helpers.fetchConversationHistory).toHaveBeenCalledWith('chat-123');
    expect(helpers.fetchPreviousPostProcessingMessages).toHaveBeenCalledWith(
      'chat-123',
      messageContext.createdAt
    );
    expect(helpers.fetchUserDatasets).toHaveBeenCalledWith('user-123');
    expect(postProcessingWorkflow.createRun).toHaveBeenCalled();
    expect(mockWorkflowRun.start).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalledWith(database.messages);
    expect(mockDb.set).toHaveBeenCalledWith({
      postProcessingMessage: workflowOutput,
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
      followUp: {
        suggestions: ['Ask about X'],
        analysis: 'Based on previous conversation...',
      },
    };

    // Setup mocks for follow-up scenario
    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue({
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchConversationHistory).mockResolvedValue([]);
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue(previousResults);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue([]);
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: true,
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
      [],
      previousResults,
      []
    );
  });

  it('should return error result when workflow returns no output', async () => {
    const messageId = '123e4567-e89b-12d3-a456-426614174000';

    vi.mocked(helpers.fetchMessageWithContext).mockResolvedValue({
      id: messageId,
      chatId: 'chat-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchConversationHistory).mockResolvedValue([]);
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue([]);
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
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
      userName: 'John Doe',
      organizationId: 'org-123',
    });
    vi.mocked(helpers.fetchConversationHistory).mockResolvedValue([]);
    vi.mocked(helpers.fetchPreviousPostProcessingMessages).mockResolvedValue([]);
    vi.mocked(helpers.fetchUserDatasets).mockResolvedValue([]);
    vi.mocked(helpers.buildWorkflowInput).mockReturnValue({
      conversationHistory: undefined,
      userName: 'John Doe',
      messageId,
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
      previousMessages: [],
      datasets: '',
    });
    mockWorkflowRun.start.mockResolvedValue({
      status: 'success',
      result: { initial: { assumptions: [], flagForReview: false } },
    });
    mockDb.where.mockRejectedValue(dbError);

    const result = await runTask({ messageId });

    expect(result).toEqual({
      success: false,
      messageId,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database update failed',
        details: {
          operation: 'message_post_processing_task_execution',
          messageId,
        },
      },
    });
  });
});
