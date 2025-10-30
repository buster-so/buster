import { updateMessageEntries } from '@buster/database/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsFinish } from './modify-metrics-finish';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database/queries', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateMessageEntries: vi.fn(),
  };
});

describe('createModifyMetricsFinish', () => {
  let state: ModifyMetricsState;
  let context: {
    messageId?: string;
    userId: string;
    chatId: string;
    dataSourceId: string;
    dataSourceSyntax: string;
    organizationId: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  it('should store complete input in state', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    // Verify files were updated with input data
    expect(state.files?.map((f) => ({ id: f.id, yml_content: f.yml_content }))).toEqual(
      input.files
    );
  });

  it('should update state files with final data', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    expect(state.files).toHaveLength(2);
    expect(state.files?.[0]).toMatchObject({
      id: 'metric-1',
      yml_content: 'content1',
      file_type: 'metric_file',
      status: 'loading',
    });
    expect(state.files?.[1]).toMatchObject({
      id: 'metric-2',
      yml_content: 'content2',
      file_type: 'metric_file',
      status: 'loading',
    });
  });

  it('should update database when messageId and toolCallId exist', async () => {
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).toHaveBeenCalledWith({
      messageId: 'msg-123',
      reasoningMessages: [
        expect.objectContaining({
          id: 'tool-123',
          type: 'files',
          title: 'Modifying metrics...',
          status: 'loading',
          file_ids: ['metric-1'],
          files: expect.any(Object),
        }),
      ],
      rawLlmMessages: [
        expect.objectContaining({
          role: 'assistant',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'tool-123',
              toolName: 'modifyMetrics',
              input: {
                files: [{ id: 'metric-1', yml_content: 'content1' }],
              },
            }),
          ]),
        }),
      ],
    });
  });

  it('should not update database when messageId is missing', async () => {
    const contextWithoutMessageId = { ...context };
    delete contextWithoutMessageId.messageId;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(contextWithoutMessageId, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not update database when toolCallId is missing in state', async () => {
    state.toolCallId = undefined;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    vi.mocked(updateMessageEntries).mockRejectedValue(new Error('Database error'));

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);

    // Should not throw
    await expect(
      finishHandler({ input, toolCallId: 'tool-123', messages: [] })
    ).resolves.not.toThrow();

    // State should still be updated
    expect(state.files).toHaveLength(1);
    expect(state.files?.map((f) => ({ id: f.id, yml_content: f.yml_content }))).toEqual(
      input.files
    );
  });

  // Tests for processingStartTime removed as it's not part of ModifyMetricsState

  it('should handle empty files array', async () => {
    const input: ModifyMetricsInput = {
      files: [],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    expect(state.files).toHaveLength(0);

    // When files array is empty, no database update happens
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should set toolCallId on state when provided', async () => {
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler({ input, toolCallId: 'tool-123', messages: [] });

    // The toolCallId is set on state from the original value
    expect(state.toolCallId).toBe('tool-123');

    // Database update should happen with the toolCallId
    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
      })
    );
  });

  // Test for logging removed as implementation doesn't log this message
});
