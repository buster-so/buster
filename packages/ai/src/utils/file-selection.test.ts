import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { describe, expect, it } from 'vitest';
import {
  type ExtractedFile,
  createFileResponseMessages,
  extractFilesFromReasoning,
  selectFilesForResponse,
} from './file-selection';

describe('file-selection', () => {
  describe('extractFilesFromReasoning', () => {
    it('should extract created metrics with version numbers', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'test-1',
          type: 'files',
          title: 'Created 2 metrics',
          status: 'completed',
          file_ids: ['metric-1', 'metric-2'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'Revenue Metric',
              version_number: 1,
              status: 'completed',
              file: {
                text: '{"name": "Revenue Metric", "sql": "SELECT revenue FROM sales"}',
              },
            },
            'metric-2': {
              id: 'metric-2',
              file_type: 'metric',
              file_name: 'Growth Metric',
              version_number: 1,
              status: 'completed',
              file: {
                text: '{"name": "Growth Metric", "sql": "SELECT growth FROM analytics"}',
              },
            },
          },
        },
      ];

      const files = extractFilesFromReasoning(reasoningHistory);

      expect(files).toHaveLength(2);
      expect(files[0]).toMatchObject({
        id: 'metric-1',
        fileType: 'metric',
        fileName: 'Revenue Metric',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
      expect(files[1]).toMatchObject({
        id: 'metric-2',
        fileType: 'metric',
        fileName: 'Growth Metric',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    it('should extract modified dashboards with version numbers', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'test-1',
          type: 'files',
          title: 'Modified 1 dashboard',
          status: 'completed',
          file_ids: ['dashboard-1'],
          files: {
            'dashboard-1': {
              id: 'dashboard-1',
              file_type: 'dashboard',
              file_name: 'Sales Dashboard',
              version_number: 3,
              status: 'completed',
              file: {
                text: '{"name": "Sales Dashboard", "rows": [{"id": 1, "items": [{"id": "metric-1"}], "columnSizes": [12]}]}',
              },
            },
          },
        },
      ];

      const files = extractFilesFromReasoning(reasoningHistory);

      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
        fileName: 'Sales Dashboard',
        status: 'completed',
        operation: 'modified',
        versionNumber: 3,
      });
    });

    it('should build metric-to-dashboard relationships', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'test-1',
          type: 'files',
          title: 'Created 1 metric',
          status: 'completed',
          file_ids: ['metric-1'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'Revenue Metric',
              version_number: 1,
              status: 'completed',
              file: {
                text: '{"name": "Revenue Metric"}',
              },
            },
          },
        },
        {
          id: 'test-2',
          type: 'files',
          title: 'Created 1 dashboard',
          status: 'completed',
          file_ids: ['dashboard-1'],
          files: {
            'dashboard-1': {
              id: 'dashboard-1',
              file_type: 'dashboard',
              file_name: 'Sales Dashboard',
              version_number: 1,
              status: 'completed',
              file: {
                text: '{"name": "Sales Dashboard", "rows": [{"id": 1, "items": [{"id": "metric-1"}], "columnSizes": [12]}]}',
              },
            },
          },
        },
      ];

      const files = extractFilesFromReasoning(reasoningHistory);
      const metric = files.find((f) => f.id === 'metric-1');

      expect(metric?.containedInDashboards).toEqual(['dashboard-1']);
    });
  });

  describe('selectFilesForResponse', () => {
    it('should return dashboard when metric inside it was modified', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
          containedInDashboards: ['dashboard-1'],
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'Sales Dashboard',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent:
            '{"name": "Sales Dashboard", "rows": [{"id": 1, "items": [{"id": "metric-1"}], "columnSizes": [12]}]}',
        },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(1);
      expect(selected[0]?.id).toBe('dashboard-1');
    });

    it('should return standalone modified metrics', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
          containedInDashboards: [],
        },
        {
          id: 'metric-2',
          fileType: 'metric',
          fileName: 'Growth Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 3,
          containedInDashboards: [],
        },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(2);
      expect(selected.map((f) => f.id)).toEqual(['metric-1', 'metric-2']);
    });

    it('should return dashboard and standalone metric when both exist', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
          containedInDashboards: ['dashboard-1'],
        },
        {
          id: 'metric-2',
          fileType: 'metric',
          fileName: 'Standalone Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 1,
          containedInDashboards: [],
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'Sales Dashboard',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent:
            '{"name": "Sales Dashboard", "rows": [{"id": 1, "items": [{"id": "metric-1"}], "columnSizes": [12]}]}',
        },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(2);
      expect(selected.map((f) => f.id).sort()).toEqual(['dashboard-1', 'metric-2'].sort());
    });

    it('should prioritize dashboards over metrics in standard cases', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'Sales Dashboard',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(1);
      expect(selected[0]?.id).toBe('dashboard-1');
    });
  });

  describe('createFileResponseMessages', () => {
    it('should create response messages with correct version numbers', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          operation: 'modified',
          versionNumber: 3,
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'Sales Dashboard',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
      ];

      const messages = createFileResponseMessages(files);

      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({
        id: 'metric-1',
        type: 'file',
        file_type: 'metric',
        file_name: 'Revenue Metric',
        version_number: 3,
      });
      expect((messages[0] as any).metadata?.[0]?.message).toBe('Metric modified successfully');

      expect(messages[1]).toMatchObject({
        id: 'dashboard-1',
        type: 'file',
        file_type: 'dashboard',
        file_name: 'Sales Dashboard',
        version_number: 1,
      });
      expect((messages[1] as any).metadata?.[0]?.message).toBe('Dashboard created successfully');
    });

    it('should default to version 1 if version number is missing', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'Revenue Metric',
          status: 'completed',
          // No versionNumber provided
        },
      ];

      const messages = createFileResponseMessages(files);

      expect((messages[0] as any).version_number).toBe(1);
    });
  });
});
