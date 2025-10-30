import { updateMessageEntries } from '@buster/database/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsStart } from './modify-metrics-start';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database/queries', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateMessageEntries: vi.fn(),
  };
});

describe('createModifyMetricsStart', () => {
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
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
    };
  });

  it('should initialize state with toolCallId', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toBe('tool-123');
  });

  it('should reset state when messageId exists', async () => {
    context.messageId = 'msg-123';
    // Set initial state with files to verify they get reset
    state.files = [
      {
        id: 'metric-1',
        file_type: 'metric_file',
        version_number: 1,
        status: 'loading',
        file: { text: 'content' },
      },
    ];
    state.argsText = 'some text';

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    // State should be reset
    expect(state.files).toEqual([]);
    expect(state.argsText).toBeUndefined();
    expect(state.toolCallId).toBe('tool-123');

    // updateMessageEntries should not be called since files are reset to empty
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not create database entries when messageId is missing', async () => {
    // No messageId in context
    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-123'); // toolCallId should still be set
  });

  it('should handle start without throwing errors', async () => {
    context.messageId = 'msg-123';
    // Set initial state with files to verify they get reset
    state.files = [
      {
        id: 'metric-1',
        file_type: 'metric_file',
        version_number: 1,
        status: 'loading',
        file: { text: 'content' },
      },
    ];

    const startHandler = createModifyMetricsStart(context, state);

    // Should not throw even when starting fresh
    await expect(startHandler({ toolCallId: 'tool-123', messages: [] })).resolves.not.toThrow();

    // State should be properly initialized
    expect(state.toolCallId).toBe('tool-123');
    expect(state.files).toEqual([]);
    expect(state.argsText).toBeUndefined();

    // updateMessageEntries should not be called since files are empty after reset
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle empty files array', async () => {
    context.messageId = 'msg-123';
    // state.files is already empty from beforeEach

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(state.toolCallId).toBe('tool-123');
    // Should not call database when no files exist
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not log information', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    // The implementation doesn't log info messages
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should work with both messageId present and absent', async () => {
    // First test without messageId
    let startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-123');

    // Reset state for second test
    state = {
      argsText: 'previous text',
      files: [
        {
          id: 'metric-1',
          file_type: 'metric_file',
          version_number: 1,
          status: 'loading',
          file: { text: 'content' },
        },
      ],
    };

    // Reset mocks for clean second test
    vi.clearAllMocks();

    // Now test with messageId
    context.messageId = 'msg-456';
    startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-456', messages: [] });

    // State should be reset regardless of messageId
    expect(state.files).toEqual([]);
    expect(state.argsText).toBeUndefined();
    expect(state.toolCallId).toBe('tool-456');

    // updateMessageEntries should not be called since files are empty after reset
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });
});
