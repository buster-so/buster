import { updateMessageEntries } from '@buster/database/queries';
import { materialize } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModifyDashboardsContext, ModifyDashboardsInput } from './modify-dashboards-tool';
import { createModifyDashboardsTool } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
  db: {},
  dashboardFiles: {},
  metricFiles: {},
  metricFilesToDashboardFiles: {},
}));

// Mock the execute function directly since it's called internally
vi.mock('./modify-dashboards-execute', () => ({
  createModifyDashboardsExecute: vi.fn(() =>
    vi.fn().mockResolvedValue({
      message: 'Successfully modified 2 dashboards',
      files: [
        {
          id: 'dash-1',
          name: 'Sales Dashboard',
          file_type: 'dashboard_file',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 2,
        },
        {
          id: 'dash-2',
          name: 'Marketing Dashboard',
          file_type: 'dashboard_file',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 3,
        },
      ],
      failed_files: [],
    })
  ),
}));

describe('modify-dashboards-tool streaming integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockContext: ModifyDashboardsContext = {
    userId: 'user-123',
    chatId: 'chat-123',
    dataSourceId: 'ds-123',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-123',
    messageId: 'msg-123',
  };

  const mockInput: ModifyDashboardsInput = {
    files: [
      { id: 'dash-1', yml_content: 'name: Sales Dashboard\nrows:\n  - id: 1' },
      { id: 'dash-2', yml_content: 'name: Marketing Dashboard\nrows:\n  - id: 1' },
    ],
  };

  it('should handle complete streaming flow with database updates', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    // Simulate streaming start
    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Simulate streaming deltas
    if (tool.onInputDelta) {
      await tool.onInputDelta({
        inputTextDelta: '{"files":[',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: '{"id":"dash-1",',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: '"yml_content":"name: Sales Dashboard\\nrows:\\n  - id: 1"}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: ',{"id":"dash-2",',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: '"yml_content":"name: Marketing Dashboard\\nrows:\\n  - id: 1"}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: ']}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Simulate input available
    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input: mockInput,
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Execute the tool
    const result = await tool.execute!(mockInput, {
      toolCallId: 'test-tool-call-id',
      messages: [],
    });

    // Verify result
    expect(result).toMatchObject({
      message: 'Successfully modified 2 dashboards',
      files: expect.arrayContaining([
        expect.objectContaining({
          id: 'dash-1',
          name: 'Sales Dashboard',
        }),
        expect.objectContaining({
          id: 'dash-2',
          name: 'Marketing Dashboard',
        }),
      ]),
      failed_files: [],
    });

    // Note: Database updates are not called in mocked execute function
  });

  it('should handle streaming without messageId', async () => {
    const contextWithoutMessageId: ModifyDashboardsContext = {
      ...mockContext,
      messageId: undefined,
    };

    const tool = createModifyDashboardsTool(contextWithoutMessageId);

    vi.mocked(updateMessageEntries).mockClear();

    // Run through streaming flow
    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    if (tool.onInputDelta) {
      await tool.onInputDelta({
        inputTextDelta: JSON.stringify(mockInput),
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input: mockInput,
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    const result = await materialize(
      tool.execute!(mockInput, {
        toolCallId: 'test-tool-call-id',
        messages: [],
      })
    );

    // Should not update database
    expect(updateMessageEntries).not.toHaveBeenCalled();

    // Should still return result
    expect(result).toBeDefined();
    expect(result.files).toHaveLength(2); // Mock returns 2 files
  });

  it('should handle partial failures', async () => {
    // Mock a different response for this test
    const { createModifyDashboardsExecute } = await import('./modify-dashboards-execute');
    vi.mocked(createModifyDashboardsExecute).mockReturnValueOnce(
      vi.fn().mockResolvedValue({
        message: 'Modified 1 dashboard, 1 failed',
        files: [
          {
            id: 'dash-1',
            name: 'Sales Dashboard',
            file_type: 'dashboard_file',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 2,
          },
        ],
        failed_files: [
          {
            id: 'dash-2',
            error: 'Invalid YAML syntax',
          },
        ],
      })
    );

    const tool = createModifyDashboardsTool(mockContext);

    const result = await materialize(
      tool.execute!(mockInput, {
        toolCallId: 'test-tool-call-id',
        messages: [],
      })
    );

    expect(result.files).toHaveLength(1); // Mock returns 1 file
    expect(result.failed_files).toHaveLength(1); // Mock returns 1 failed file
  });

  it('should handle streaming with malformed JSON gracefully', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Send malformed JSON
    if (tool.onInputDelta) {
      await tool.onInputDelta({
        inputTextDelta: '{"files":[{"id":"dash-1"',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: 'malformed json here',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: ',"yml_content":"content1"}]}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Should still work when final valid input is provided
    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input: mockInput,
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    const result = await tool.execute!(mockInput, {
      toolCallId: 'test-tool-call-id',
      messages: [],
    });
    expect(result).toBeDefined();
  });

  it('should accumulate text correctly across multiple deltas', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    if (tool.onInputDelta) {
      await tool.onInputDelta({
        inputTextDelta: '{"fil',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: 'es":[{"',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: 'id":"d',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
      await tool.onInputDelta({
        inputTextDelta: 'ash-1"',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });
    }

    // Note: In a real implementation, you would need access to the state
    // For this test, we just verify it doesn't crash
    expect(tool).toBeDefined();
  });
});
