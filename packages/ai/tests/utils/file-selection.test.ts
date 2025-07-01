import { describe, it, expect } from 'vitest';
import type { ExtractedFile } from '../../src/utils/file-selection';
import { selectFilesForResponse } from '../../src/utils/file-selection';

describe('selectFilesForResponse', () => {
  describe('dashboard context integration', () => {
    it('should select dashboard from context when a modified metric belongs to it', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
        },
      ];

      const dashboardContext = [
        {
          id: 'dashboard-1',
          name: 'sales_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1', 'metric-2'],
        },
      ];

      const result = selectFilesForResponse(files, dashboardContext);

      // Should return the dashboard from context, not the metric
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
        fileName: 'sales_dashboard.yml',
        versionNumber: 1,
      });
    });

    it('should not duplicate dashboards when metric belongs to multiple dashboards', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
        },
      ];

      const dashboardContext = [
        {
          id: 'dashboard-1',
          name: 'sales_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1', 'metric-2'],
        },
        {
          id: 'dashboard-2',
          name: 'executive_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1', 'metric-3'],
        },
      ];

      const result = selectFilesForResponse(files, dashboardContext);

      // Should return both dashboards that contain the modified metric
      expect(result).toHaveLength(2);
      expect(result.map(f => f.id).sort()).toEqual(['dashboard-1', 'dashboard-2']);
    });

    it('should handle case where dashboard is in both files and context', () => {
      const files: ExtractedFile[] = [
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'sales_dashboard.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent: JSON.stringify({
            rows: [{ items: [{ id: 'metric-1' }, { id: 'metric-2' }] }],
          }),
        },
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
          containedInDashboards: ['dashboard-1'],
        },
      ];

      const dashboardContext = [
        {
          id: 'dashboard-1',
          name: 'sales_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1', 'metric-2'],
        },
      ];

      const result = selectFilesForResponse(files, dashboardContext);

      // Should return only the dashboard, not the metric
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
      });
    });

    it('should return standalone metrics not contained in any selected dashboard', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
        },
        {
          id: 'metric-2',
          fileType: 'metric',
          fileName: 'cost.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
      ];

      const dashboardContext = [
        {
          id: 'dashboard-1',
          name: 'sales_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1'], // Only contains metric-1
        },
      ];

      const result = selectFilesForResponse(files, dashboardContext);

      // Should return dashboard-1 (contains modified metric-1) and metric-2 (standalone)
      expect(result).toHaveLength(2);
      expect(result.map(f => f.id).sort()).toEqual(['dashboard-1', 'metric-2']);
    });
  });

  describe('basic file selection without context', () => {
    it('should prioritize dashboards over metrics when no context provided', () => {
      const files: ExtractedFile[] = [
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'sales_dashboard.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent: JSON.stringify({
            rows: [{ items: [{ id: 'metric-1' }] }],
          }),
        },
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          containedInDashboards: ['dashboard-1'],
        },
      ];

      const result = selectFilesForResponse(files);

      // Should return only the dashboard
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
      });
    });

    it('should return all metrics when no dashboards present', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
        {
          id: 'metric-2',
          fileType: 'metric',
          fileName: 'cost.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
      ];

      const result = selectFilesForResponse(files);

      expect(result).toHaveLength(2);
      expect(result.map(f => f.id).sort()).toEqual(['metric-1', 'metric-2']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files array', () => {
      const result = selectFilesForResponse([]);
      expect(result).toEqual([]);
    });

    it('should handle empty dashboard context', () => {
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
        },
      ];

      const result = selectFilesForResponse(files, []);

      // Should return the metric since no dashboard context
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('metric-1');
    });

    it('should handle invalid dashboard YML content gracefully', () => {
      const files: ExtractedFile[] = [
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'sales_dashboard.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent: 'invalid json',
        },
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'revenue.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
        },
      ];

      const result = selectFilesForResponse(files);

      // Should return both since we can't determine if metric is in dashboard
      expect(result).toHaveLength(2);
    });
  });

  describe('real-world scenarios from user report', () => {
    it('should not return all metrics when dashboard is selected', () => {
      // Scenario 1: Dashboard created with multiple metrics
      const files: ExtractedFile[] = [
        {
          id: 'dashboard-1',
          fileType: 'dashboard',
          fileName: 'analysis_dashboard.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          ymlContent: JSON.stringify({
            rows: [
              { items: [{ id: 'metric-1' }, { id: 'metric-2' }] },
              { items: [{ id: 'metric-3' }] },
            ],
          }),
        },
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'total_revenue.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          containedInDashboards: ['dashboard-1'],
        },
        {
          id: 'metric-2',
          fileType: 'metric',
          fileName: 'avg_order_value.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          containedInDashboards: ['dashboard-1'],
        },
        {
          id: 'metric-3',
          fileType: 'metric',
          fileName: 'customer_count.yml',
          status: 'completed',
          operation: 'created',
          versionNumber: 1,
          containedInDashboards: ['dashboard-1'],
        },
      ];

      const result = selectFilesForResponse(files);

      // Should only return the dashboard, not its metrics
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
      });
    });

    it('should select dashboard when its metric is modified in follow-up', () => {
      // Scenario 2: Modifying a metric that belongs to an existing dashboard
      const files: ExtractedFile[] = [
        {
          id: 'metric-1',
          fileType: 'metric',
          fileName: 'total_revenue.yml',
          status: 'completed',
          operation: 'modified',
          versionNumber: 2,
        },
      ];

      const dashboardContext = [
        {
          id: 'dashboard-1',
          name: 'analysis_dashboard.yml',
          versionNumber: 1,
          metricIds: ['metric-1', 'metric-2', 'metric-3'],
        },
      ];

      const result = selectFilesForResponse(files, dashboardContext);

      // Should return the dashboard from context, not the modified metric
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'dashboard-1',
        fileType: 'dashboard',
        fileName: 'analysis_dashboard.yml',
      });
    });
  });
});