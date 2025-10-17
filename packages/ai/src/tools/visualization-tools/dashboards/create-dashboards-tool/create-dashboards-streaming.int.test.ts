import { materialize } from '@buster/test-utils';
import type { ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateDashboardsContext, CreateDashboardsInput } from './create-dashboards-tool';
import { createCreateDashboardsTool } from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
  db: {},
  dashboardFiles: {},
  metricFiles: {},
  metricFilesToDashboardFiles: {},
  assetPermissions: {},
}));

vi.mock('./create-dashboards-execute', () => ({
  createCreateDashboardsExecute: vi.fn(() => vi.fn()),
}));

describe('create-dashboards-tool streaming integration', () => {
  let context: CreateDashboardsContext;
  let updateMessageEntries: ReturnType<typeof vi.fn>;
  let mockExecute: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const database = await import('@buster/database/queries');
    updateMessageEntries = vi.mocked(database.updateMessageEntries);

    const executeModule = await import('./create-dashboards-execute');
    const createExecute = vi.mocked(executeModule.createCreateDashboardsExecute);
    mockExecute = vi.fn();
    createExecute.mockReturnValue(mockExecute);

    context = {
      userId: 'user-1',
      chatId: 'chat-1',
      dataSourceId: 'ds-1',
      dataSourceSyntax: 'postgresql',
      organizationId: 'org-1',
      messageId: 'msg-1',
    };
  });

  describe('full streaming workflow', () => {
    it('should handle complete streaming flow with database updates', async () => {
      updateMessageEntries.mockResolvedValue(undefined);
      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard_file',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      // Simulate streaming callbacks
      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      if (tool.onInputDelta) {
        // Simulate string deltas
        await tool.onInputDelta({
          inputTextDelta: '{"files":[',
          toolCallId: 'tool-123',
          messages: [],
        });
        await tool.onInputDelta({
          inputTextDelta: '{"name":"Test Dashboard",',
          toolCallId: 'tool-123',
          messages: [],
        });
        await tool.onInputDelta({
          inputTextDelta: '"yml_content":"name: Test Dashboard\\nrows: []"}]}',
          toolCallId: 'tool-123',
          messages: [],
        });
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable({ input, toolCallId: 'tool-123', messages: [] });
      }

      // Execute the tool
      const rawResult = await tool.execute!(input, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);

      // Verify message entries were updated
      expect(updateMessageEntries).toHaveBeenCalled();

      // Verify execution result
      expect(result).toEqual({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: expect.arrayContaining([
          expect.objectContaining({
            id: 'dashboard-1',
            name: 'Test Dashboard',
          }),
        ]),
        failed_files: [],
      });
    });

    it('should handle streaming without messageId', async () => {
      const contextWithoutMessageId = { ...context, messageId: undefined };

      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard_file',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(contextWithoutMessageId);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      // Simulate streaming callbacks
      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable({ input, toolCallId: 'tool-123', messages: [] });
      }

      const rawResult = await tool.execute!(input, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);

      // Should not update database entries
      expect(updateMessageEntries).not.toHaveBeenCalled();

      // But should still execute successfully
      expect(result.files).toHaveLength(1);
    });

    it('should handle partial failures', async () => {
      updateMessageEntries.mockResolvedValue(undefined);
      mockExecute.mockResolvedValue({
        message: 'Partially created dashboards',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Dashboard 1',
            file_type: 'dashboard_file',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [
          {
            name: 'Dashboard 2',
            error: 'Invalid YAML',
          },
        ],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [
          { name: 'Dashboard 1', yml_content: 'name: Dashboard 1\nrows: []' },
          { name: 'Dashboard 2', yml_content: 'invalid yaml' },
        ],
      };

      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable({ input, toolCallId: 'tool-123', messages: [] });
      }

      const rawResult = await tool.execute!(input, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);

      expect(result.files).toHaveLength(1);
      expect(result.failed_files).toHaveLength(1);
      expect(result.failed_files[0]).toEqual({
        name: 'Dashboard 2',
        error: 'Invalid YAML',
      });

      // Final update should reflect the failure
      expect(updateMessageEntries).toHaveBeenCalled();
    });

    it('should handle complete failure', async () => {
      updateMessageEntries.mockResolvedValue(undefined);
      mockExecute.mockRejectedValue(new Error('Execution failed'));

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Dashboard 1', yml_content: 'name: Dashboard 1\nrows: []' }],
      };

      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      await expect(
        tool.execute!(input, {
          toolCallId: 'tool-123',
          messages: [],
          abortSignal: new AbortController().signal,
        })
      ).rejects.toThrow('Execution failed');

      // updateMessageEntries won't be called since there's no state.files to update
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      updateMessageEntries.mockRejectedValue(new Error('Database error'));
      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard_file',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      // Should still execute successfully despite database error
      const rawResult = await tool.execute!(input, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);
      expect(result.files).toHaveLength(1);
    });
  });

  describe('object delta handling', () => {
    it('should handle object deltas during streaming', async () => {
      updateMessageEntries.mockResolvedValue(undefined);

      const tool = createCreateDashboardsTool(context);

      if (tool.onInputStart) {
        await tool.onInputStart({ toolCallId: 'tool-123', messages: [] });
      }

      if (tool.onInputDelta) {
        // Send object delta instead of string
        const deltaText = JSON.stringify({
          files: [
            { name: 'Dashboard 1', yml_content: 'content1' },
            { name: 'Dashboard 2', yml_content: 'content2' },
          ],
        });
        await tool.onInputDelta({
          inputTextDelta: deltaText,
          toolCallId: 'tool-123',
          messages: [],
        });
      }

      // Verify database was updated with the files
      expect(updateMessageEntries).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      mockExecute.mockResolvedValue({
        message: 'No dashboards to create',
        duration: 10,
        files: [],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [],
      };

      const rawResult = await tool.execute!(input, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);
      expect(result.files).toHaveLength(0);
      expect(result.failed_files).toHaveLength(0);
    });

    it('should handle very large input', async () => {
      const largeInput: CreateDashboardsInput = {
        files: Array.from({ length: 100 }, (_, i) => ({
          name: `Dashboard ${i + 1}`,
          yml_content: `name: Dashboard ${i + 1}\nrows: []`,
        })),
      };

      mockExecute.mockResolvedValue({
        message: 'Successfully created 100 dashboards',
        duration: 1000,
        files: largeInput.files.map((f, i) => ({
          id: `dashboard-${i + 1}`,
          name: f.name,
          file_type: 'dashboard_file',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 1,
        })),
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const rawResult = await tool.execute!(largeInput, {
        toolCallId: 'tool-123',
        messages: [],
        abortSignal: new AbortController().signal,
      });
      const result = await materialize(rawResult);

      expect(result.files).toHaveLength(100);
    });
  });
});
