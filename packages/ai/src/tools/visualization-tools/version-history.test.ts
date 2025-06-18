import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDashboardVersionToHistory,
  addMetricVersionToHistory,
  createDashboardVersionEntry,
  createInitialDashboardVersionHistory,
  createInitialMetricVersionHistory,
  createMetricVersionEntry,
  dashboardYmlToVersionContent,
  getLatestDashboardVersion,
  getLatestMetricVersion,
  getLatestVersionNumber,
  metricYmlToVersionContent,
} from './version-history-helpers';
import type {
  DashboardContent,
  DashboardVersionHistory,
  MetricContent,
  MetricVersionHistory,
} from './version-history-types';

describe('Version History Helpers', () => {
  const mockTimestamp = '2025-05-02T17:18:46.207629Z';

  const mockMetricContent: MetricContent = {
    sql: 'SELECT SUM(revenue) as total FROM sales',
    name: 'Total Revenue',
    timeFrame: 'Q2 2023 - Q1 2024',
    chartConfig: {
      selectedChartType: 'metric',
      metricColumnId: 'total',
      columnLabelFormats: {
        total: {
          columnType: 'number',
          style: 'currency',
          currency: 'USD',
          numberSeparatorStyle: ',',
          replaceMissingDataWith: 0,
        },
      },
    },
    description: 'Total sales revenue for the period',
  };

  const mockDashboardContent: DashboardContent = {
    name: 'Revenue Dashboard',
    rows: [
      {
        id: 1,
        items: [{ id: '1ab2b66a-9ca6-5120-9155-20998b802c6a' }],
        columnSizes: [12],
      },
      {
        id: 2,
        items: [
          { id: 'ea6b0583-e9cb-5b2f-a18c-69571042ee67' },
          { id: 'b19d2606-6061-5d22-8628-78a4878310d4' },
        ],
        columnSizes: [6, 6],
      },
    ],
    description: 'Dashboard showing revenue metrics',
  };

  describe('createMetricVersionEntry', () => {
    it('should create a metric version entry with provided timestamp', () => {
      const entry = createMetricVersionEntry(mockMetricContent, 1, mockTimestamp);

      expect(entry).toEqual({
        content: mockMetricContent,
        updated_at: mockTimestamp,
        version_number: 1,
      });
    });

    it('should create a metric version entry with current timestamp if not provided', () => {
      const entry = createMetricVersionEntry(mockMetricContent, 2);

      expect(entry.content).toEqual(mockMetricContent);
      expect(entry.version_number).toBe(2);
      expect(entry.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createDashboardVersionEntry', () => {
    it('should create a dashboard version entry with provided timestamp', () => {
      const entry = createDashboardVersionEntry(mockDashboardContent, 1, mockTimestamp);

      expect(entry).toEqual({
        content: mockDashboardContent,
        updated_at: mockTimestamp,
        version_number: 1,
      });
    });

    it('should create a dashboard version entry with current timestamp if not provided', () => {
      const entry = createDashboardVersionEntry(mockDashboardContent, 2);

      expect(entry.content).toEqual(mockDashboardContent);
      expect(entry.version_number).toBe(2);
      expect(entry.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createInitialMetricVersionHistory', () => {
    it('should create initial version history with version 1', () => {
      const history = createInitialMetricVersionHistory(mockMetricContent, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: mockMetricContent,
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should match expected JSONB format', () => {
      const history = createInitialMetricVersionHistory(mockMetricContent, mockTimestamp);
      const json = JSON.stringify(history);
      const parsed = JSON.parse(json);

      expect(parsed['1']).toBeDefined();
      expect(parsed['1'].content.sql).toBe(mockMetricContent.sql);
      expect(parsed['1'].version_number).toBe(1);
    });
  });

  describe('createInitialDashboardVersionHistory', () => {
    it('should create initial version history with version 1', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardContent, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: mockDashboardContent,
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should match expected JSONB format', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardContent, mockTimestamp);
      const json = JSON.stringify(history);
      const parsed = JSON.parse(json);

      expect(parsed['1']).toBeDefined();
      expect(parsed['1'].content.name).toBe(mockDashboardContent.name);
      expect(parsed['1'].version_number).toBe(1);
    });
  });

  describe('addMetricVersionToHistory', () => {
    it('should create initial version when history is null', () => {
      const history = addMetricVersionToHistory(null, mockMetricContent, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: mockMetricContent,
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should create initial version when history is undefined', () => {
      const history = addMetricVersionToHistory(undefined, mockMetricContent, mockTimestamp);

      expect(history['1']).toBeDefined();
      expect(history['1']?.version_number).toBe(1);
    });

    it('should create initial version when history is empty object', () => {
      const history = addMetricVersionToHistory({}, mockMetricContent, mockTimestamp);

      expect(history['1']).toBeDefined();
      expect(history['1']?.version_number).toBe(1);
    });

    it('should add version 2 to existing history', () => {
      const existingHistory: MetricVersionHistory = {
        '1': createMetricVersionEntry(mockMetricContent, 1, '2025-05-01T10:00:00.000Z'),
      };

      const updatedContent = { ...mockMetricContent, name: 'Updated Revenue' };
      const history = addMetricVersionToHistory(existingHistory, updatedContent, mockTimestamp);

      expect(Object.keys(history)).toHaveLength(2);
      expect(history['1']).toEqual(existingHistory['1']);
      expect(history['2']).toEqual({
        content: updatedContent,
        updated_at: mockTimestamp,
        version_number: 2,
      });
    });

    it('should handle non-sequential version numbers', () => {
      const existingHistory: MetricVersionHistory = {
        '1': createMetricVersionEntry(mockMetricContent, 1),
        '3': createMetricVersionEntry(mockMetricContent, 3),
        '5': createMetricVersionEntry(mockMetricContent, 5),
      };

      const history = addMetricVersionToHistory(existingHistory, mockMetricContent, mockTimestamp);

      expect(history['6']).toBeDefined();
      expect(history['6']?.version_number).toBe(6);
    });
  });

  describe('addDashboardVersionToHistory', () => {
    it('should create initial version when history is null', () => {
      const history = addDashboardVersionToHistory(null, mockDashboardContent, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: mockDashboardContent,
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should add version 2 to existing history', () => {
      const existingHistory: DashboardVersionHistory = {
        '1': createDashboardVersionEntry(mockDashboardContent, 1, '2025-05-01T10:00:00.000Z'),
      };

      const updatedContent = { ...mockDashboardContent, name: 'Updated Dashboard' };
      const history = addDashboardVersionToHistory(existingHistory, updatedContent, mockTimestamp);

      expect(Object.keys(history)).toHaveLength(2);
      expect(history['1']).toEqual(existingHistory['1']);
      expect(history['2']).toEqual({
        content: updatedContent,
        updated_at: mockTimestamp,
        version_number: 2,
      });
    });
  });

  describe('getLatestVersionNumber', () => {
    it('should return 0 for null history', () => {
      expect(getLatestVersionNumber(null)).toBe(0);
    });

    it('should return 0 for undefined history', () => {
      expect(getLatestVersionNumber(undefined)).toBe(0);
    });

    it('should return 0 for empty history', () => {
      expect(getLatestVersionNumber({})).toBe(0);
    });

    it('should return latest version number', () => {
      const history: MetricVersionHistory = {
        '1': createMetricVersionEntry(mockMetricContent, 1),
        '2': createMetricVersionEntry(mockMetricContent, 2),
        '3': createMetricVersionEntry(mockMetricContent, 3),
      };

      expect(getLatestVersionNumber(history)).toBe(3);
    });

    it('should handle non-sequential version numbers', () => {
      const history: MetricVersionHistory = {
        '1': createMetricVersionEntry(mockMetricContent, 1),
        '5': createMetricVersionEntry(mockMetricContent, 5),
        '3': createMetricVersionEntry(mockMetricContent, 3),
      };

      expect(getLatestVersionNumber(history)).toBe(5);
    });
  });

  describe('getLatestMetricVersion', () => {
    it('should return null for null history', () => {
      expect(getLatestMetricVersion(null)).toBeNull();
    });

    it('should return null for empty history', () => {
      expect(getLatestMetricVersion({})).toBeNull();
    });

    it('should return latest version entry', () => {
      const latestContent = { ...mockMetricContent, name: 'Latest Version' };
      const history: MetricVersionHistory = {
        '1': createMetricVersionEntry(mockMetricContent, 1),
        '2': createMetricVersionEntry(mockMetricContent, 2),
        '3': createMetricVersionEntry(latestContent, 3, mockTimestamp),
      };

      const latest = getLatestMetricVersion(history);
      expect(latest).toEqual({
        content: latestContent,
        updated_at: mockTimestamp,
        version_number: 3,
      });
    });
  });

  describe('getLatestDashboardVersion', () => {
    it('should return null for null history', () => {
      expect(getLatestDashboardVersion(null)).toBeNull();
    });

    it('should return latest version entry', () => {
      const latestContent = { ...mockDashboardContent, name: 'Latest Dashboard' };
      const history: DashboardVersionHistory = {
        '1': createDashboardVersionEntry(mockDashboardContent, 1),
        '2': createDashboardVersionEntry(latestContent, 2, mockTimestamp),
      };

      const latest = getLatestDashboardVersion(history);
      expect(latest).toEqual({
        content: latestContent,
        updated_at: mockTimestamp,
        version_number: 2,
      });
    });
  });

  describe('metricYmlToVersionContent', () => {
    it('should convert metric YML to version content format', () => {
      const yml = {
        name: 'Test Metric',
        description: 'Test description',
        timeFrame: '2024',
        sql: 'SELECT * FROM test',
        chartConfig: { selectedChartType: 'metric' as const, columnLabelFormats: {} },
      };

      const content = metricYmlToVersionContent(yml);

      expect(content).toEqual({
        sql: yml.sql,
        name: yml.name,
        timeFrame: yml.timeFrame,
        chartConfig: yml.chartConfig,
        description: yml.description,
      });
    });

    it('should handle missing description', () => {
      const yml = {
        name: 'Test Metric',
        timeFrame: '2024',
        sql: 'SELECT * FROM test',
        chartConfig: { selectedChartType: 'metric' as const, columnLabelFormats: {} },
      };

      const content = metricYmlToVersionContent(yml);

      expect(content.description).toBe('');
    });
  });

  describe('dashboardYmlToVersionContent', () => {
    it('should convert dashboard YML to version content format', () => {
      const yml = {
        name: 'Test Dashboard',
        description: 'Test description',
        rows: [
          {
            id: 1,
            items: [{ id: 'metric-1' }],
            columnSizes: [12],
          },
        ],
      };

      const content = dashboardYmlToVersionContent(yml);

      expect(content).toEqual({
        name: yml.name,
        rows: yml.rows,
        description: yml.description,
      });
    });

    it('should handle missing description', () => {
      const yml = {
        name: 'Test Dashboard',
        rows: [
          {
            id: 1,
            items: [{ id: 'metric-1' }],
            columnSizes: [12],
          },
        ],
      };

      const content = dashboardYmlToVersionContent(yml);

      expect(content.description).toBe('');
    });
  });

  describe('JSONB Compatibility', () => {
    it('should produce valid JSONB for metric version history', () => {
      const history = createInitialMetricVersionHistory(mockMetricContent, mockTimestamp);
      const updatedHistory = addMetricVersionToHistory(
        history,
        { ...mockMetricContent, name: 'Updated' },
        '2025-05-03T10:00:00.000Z'
      );

      const json = JSON.stringify(updatedHistory);
      const parsed = JSON.parse(json);

      // Verify structure matches expected format
      expect(Object.keys(parsed).sort()).toEqual(['1', '2']);
      expect(parsed['1'].version_number).toBe(1);
      expect(parsed['2'].version_number).toBe(2);
      expect(parsed['1'].content.name).toBe('Total Revenue');
      expect(parsed['2'].content.name).toBe('Updated');
    });

    it('should produce valid JSONB for dashboard version history', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardContent, mockTimestamp);
      const updatedHistory = addDashboardVersionToHistory(
        history,
        { ...mockDashboardContent, name: 'Updated Dashboard' },
        '2025-05-03T10:00:00.000Z'
      );

      const json = JSON.stringify(updatedHistory);
      const parsed = JSON.parse(json);

      // Verify structure matches expected format
      expect(Object.keys(parsed).sort()).toEqual(['1', '2']);
      expect(parsed['1'].version_number).toBe(1);
      expect(parsed['2'].version_number).toBe(2);
      expect(parsed['1'].content.name).toBe('Revenue Dashboard');
      expect(parsed['2'].content.name).toBe('Updated Dashboard');
    });
  });
});
