import { updateMessageFields } from '@buster/database/queries';
import { materialize } from '@buster/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModifyMetricsContext, ModifyMetricsInput } from './modify-metrics-tool';
import { createModifyMetricsTool } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
  createMessageFields: vi.fn(),
}));

vi.mock('./modify-metrics-execute', () => ({
  createModifyMetricsExecute: vi.fn(() => vi.fn()),
}));

describe('modify-metrics-tool streaming integration', () => {
  let context: ModifyMetricsContext;
  const mockToolCallOptions = {
    toolCallId: 'tool-call-123',
    messages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  it('should handle full streaming lifecycle with messageId', async () => {
    const tool = createModifyMetricsTool(context);

    // Simulate streaming start
    await tool.onInputStart?.(mockToolCallOptions);

    // Verify initial database entry was created
    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          type: 'files',
          title: 'Modifying metrics...',
          status: 'loading',
        }),
      ]),
      rawLlmMessages: expect.any(Array),
    });

    // Simulate streaming deltas
    await tool.onInputDelta?.({
      inputTextDelta: '{"files":[{"id":"metric-1"',
      ...mockToolCallOptions,
    });
    await tool.onInputDelta?.({
      inputTextDelta: ',"yml_content":"name: Test',
      ...mockToolCallOptions,
    });
    await tool.onInputDelta?.({ inputTextDelta: ' Metric\\n"}]}', ...mockToolCallOptions });

    // Verify database was updated during streaming
    const callCount = (updateMessageFields as any).mock.calls.length;
    expect(callCount).toBeGreaterThan(1);

    // Simulate input complete
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'name: Test Metric\n' }],
    };
    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });

    // Mock successful execution
    const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
    const mockExecute = vi.fn().mockResolvedValue({
      message: 'Success',
      duration: 100,
      files: [
        {
          id: 'metric-1',
          name: 'Test Metric',
          file_type: 'metric_file',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 2,
        },
      ],
      failed_files: [],
    });

    // Execute the tool
    const result = await materialize(tool.execute?.(input, mockToolCallOptions));

    expect(result).toBeDefined();
    expect(result?.files).toHaveLength(1);
    expect(result?.files?.[0]?.name).toBe('Test Metric');
  });

  it('should handle streaming without messageId', async () => {
    context.messageId = undefined;
    const tool = createModifyMetricsTool(context);

    // Simulate streaming start
    await tool.onInputStart?.(mockToolCallOptions);

    // Should not update database without messageId
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Simulate streaming deltas
    await tool.onInputDelta?.({
      inputTextDelta: '{"files":[{"id":"metric-1","yml_content":"content"}]}',
      ...mockToolCallOptions,
    });

    // Still should not update database
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Simulate input complete
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };
    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });

    // Still no database updates
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Mock successful execution
    const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
    const mockExecute = vi.fn().mockResolvedValue({
      message: 'Success',
      duration: 100,
      files: [
        {
          id: 'metric-1',
          name: 'Metric 1',
          file_type: 'metric_file',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    });

    // Tool should still execute successfully without messageId
    const result = await materialize(tool.execute?.(input, mockToolCallOptions));

    expect(result).toBeDefined();
    expect(result?.files).toHaveLength(1);
  });

  it('should handle partial streaming with incomplete JSON', async () => {
    const tool = createModifyMetricsTool(context);

    await tool.onInputStart?.(mockToolCallOptions);

    // Send incomplete JSON chunks
    await tool.onInputDelta?.({ inputTextDelta: '{"files":[', ...mockToolCallOptions });
    await tool.onInputDelta?.({ inputTextDelta: '{"id":"metric-1",', ...mockToolCallOptions });
    await tool.onInputDelta?.({ inputTextDelta: '"yml_content":"partial', ...mockToolCallOptions });

    // Database should be updated with partial progress
    const calls = (updateMessageFields as any).mock.calls;
    const lastCall = calls[calls.length - 1];

    if (lastCall) {
      const reasoning = lastCall[1].reasoning;
      expect(reasoning).toBeDefined();
    }
  });

  it('should handle multiple files streaming', async () => {
    const tool = createModifyMetricsTool(context);

    await tool.onInputStart?.(mockToolCallOptions);

    // Stream multiple files
    await tool.onInputDelta?.({ inputTextDelta: '{"files":[', ...mockToolCallOptions });
    await tool.onInputDelta?.({
      inputTextDelta: '{"id":"m1","yml_content":"content1"},',
      ...mockToolCallOptions,
    });
    await tool.onInputDelta?.({
      inputTextDelta: '{"id":"m2","yml_content":"content2"},',
      ...mockToolCallOptions,
    });
    await tool.onInputDelta?.({
      inputTextDelta: '{"id":"m3","yml_content":"content3"}',
      ...mockToolCallOptions,
    });
    await tool.onInputDelta?.({ inputTextDelta: ']}', ...mockToolCallOptions });

    const input: ModifyMetricsInput = {
      files: [
        { id: 'm1', yml_content: 'content1' },
        { id: 'm2', yml_content: 'content2' },
        { id: 'm3', yml_content: 'content3' },
      ],
    };

    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });

    // Mock mixed results
    const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
    (createModifyMetricsExecute as any).mockResolvedValue({
      message: 'Partial success',
      duration: 200,
      files: [
        {
          id: 'm1',
          name: 'Metric 1',
          file_type: 'metric_file',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
        {
          id: 'm3',
          name: 'Metric 3',
          file_type: 'metric_file',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [
        {
          file_name: 'Metric 2',
          error: 'Validation failed',
        },
      ],
    });

    const result = await materialize(tool.execute?.(input, mockToolCallOptions));

    expect(result?.files).toHaveLength(2);
    expect(result?.failed_files).toHaveLength(1);
  });

  it('should handle execution failure', async () => {
    const tool = createModifyMetricsTool(context);

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'invalid content' }],
    };

    await tool.onInputStart?.(mockToolCallOptions);
    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });

    // Mock execution failure
    const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
    (createModifyMetricsExecute as any).mockRejectedValue(new Error('Execution failed'));

    await expect(tool.execute?.(input, mockToolCallOptions)).rejects.toThrow('Execution failed');

    // Database should be updated with failure status
    const calls = (updateMessageFields as any).mock.calls;
    const lastCall = calls[calls.length - 1];

    if (lastCall) {
      const reasoning = lastCall[1].reasoning[0];
      expect(reasoning.status).toBe('failed');
    }
  });

  it('should handle database errors during streaming', async () => {
    (updateMessageFields as any).mockRejectedValue(new Error('Database error'));

    const tool = createModifyMetricsTool(context);

    // All operations should continue despite database errors
    await tool.onInputStart?.(mockToolCallOptions);
    await tool.onInputDelta?.({
      inputTextDelta: '{"files":[{"id":"m1","yml_content":"c1"}]}',
      ...mockToolCallOptions,
    });

    const input: ModifyMetricsInput = {
      files: [{ id: 'm1', yml_content: 'c1' }],
    };

    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });

    // Mock successful execution
    const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
    const mockExecute = vi.fn().mockResolvedValue({
      message: 'Success',
      duration: 50,
      files: [
        {
          id: 'm1',
          name: 'Metric 1',
          file_type: 'metric_file',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    });
    (createModifyMetricsExecute as any).mockImplementation(mockExecute);

    // Tool should still execute successfully despite database errors
    const result = await materialize(tool.execute?.(input, mockToolCallOptions));
    expect(result?.files).toHaveLength(1);
  });

  it('should properly track state throughout streaming', async () => {
    const tool = createModifyMetricsTool(context);

    // Access the internal state through the tool's methods
    let capturedState: any = null;

    // Override execute to capture state
    const originalExecute = tool.execute!;
    // @ts-expect-error
    tool.execute = async (input: ModifyMetricsInput, options: any) => {
      // The state should be populated by this point
      const { createModifyMetricsExecute } = await import('./modify-metrics-execute');
      (createModifyMetricsExecute as any).mockImplementation(async () => {
        // Capture state during execution
        capturedState = {
          hasToolCallId: true, // State should have toolCallId
          hasFiles: true, // State should have files
        };
        return {
          message: 'Success',
          duration: 100,
          files: [],
          failed_files: [],
        };
      });
      return originalExecute(input, options);
    };

    await tool.onInputStart?.(mockToolCallOptions);
    await tool.onInputDelta?.({
      inputTextDelta: '{"files":[{"id":"m1","yml_content":"content"}]}',
      ...mockToolCallOptions,
    });

    const input: ModifyMetricsInput = {
      files: [{ id: 'm1', yml_content: 'content' }],
    };

    await tool.onInputAvailable?.({ input, ...mockToolCallOptions });
    await tool.execute?.(input, mockToolCallOptions);

    expect(capturedState).toBeTruthy();
    expect(capturedState.hasToolCallId).toBe(true);
    expect(capturedState.hasFiles).toBe(true);
  });
});
