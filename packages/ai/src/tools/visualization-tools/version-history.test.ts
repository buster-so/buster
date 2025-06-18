import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDashboardVersionToHistory,
  addMetricVersionToHistory,
  createDashboardVersion,
  createInitialDashboardVersionHistory,
  createInitialMetricVersionHistory,
  createMetricVersion,
  getLatestVersion,
  getLatestVersionNumber,
  validateDashboardYml,
  validateMetricYml,
} from './version-history-helpers';
import type { DashboardYml, MetricYml, Version, VersionHistory } from './version-history-types';

describe('Version History Helpers', () => {
  const mockTimestamp = '2025-05-02T17:18:46.207629Z';

  const mockMetricYml: MetricYml = {
    sql: 'SELECT SUM(revenue) as total FROM sales',
    name: 'Total Revenue',
    time_frame: 'Q2 2023 - Q1 2024', // Note: time_frame not timeFrame
    chart_config: {
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

  const mockDashboardYml: DashboardYml = {
    name: 'Revenue Dashboard',
    rows: [
      {
        id: 1,
        items: [{ id: '1ab2b66a-9ca6-5120-9155-20998b802c6a' }],
        column_sizes: [12], // Note: column_sizes not columnSizes
      },
      {
        id: 2,
        items: [
          { id: 'ea6b0583-e9cb-5b2f-a18c-69571042ee67' },
          { id: 'b19d2606-6061-5d22-8628-78a4878310d4' },
        ],
        column_sizes: [6, 6],
      },
    ],
    description: 'Dashboard showing revenue metrics',
  };

  describe('createMetricVersion', () => {
    it('should create a metric version entry with provided timestamp', () => {
      const entry = createMetricVersion(mockMetricYml, 1, mockTimestamp);

      expect(entry).toEqual({
        content: {
          name: mockMetricYml.name,
          description: mockMetricYml.description,
          timeFrame: mockMetricYml.time_frame, // Converted to camelCase
          sql: mockMetricYml.sql,
          chartConfig: mockMetricYml.chart_config, // Converted to camelCase
        },
        updated_at: mockTimestamp,
        version_number: 1,
      });
    });

    it('should create a metric version entry with current timestamp if not provided', () => {
      const entry = createMetricVersion(mockMetricYml, 2);

      expect(entry.content).toEqual({
        name: mockMetricYml.name,
        description: mockMetricYml.description,
        timeFrame: mockMetricYml.time_frame, // Converted to camelCase
        sql: mockMetricYml.sql,
        chartConfig: mockMetricYml.chart_config, // Converted to camelCase
      });
      expect(entry.version_number).toBe(2);
      expect(entry.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createDashboardVersion', () => {
    it('should create a dashboard version entry with provided timestamp', () => {
      const entry = createDashboardVersion(mockDashboardYml, 1, mockTimestamp);

      expect(entry).toEqual({
        content: {
          name: mockDashboardYml.name,
          description: mockDashboardYml.description,
          rows: mockDashboardYml.rows.map((row) => ({
            id: row.id,
            items: row.items,
            columnSizes: row.column_sizes, // Converted to camelCase
            rowHeight: row.row_height, // Converted to camelCase
          })),
        },
        updated_at: mockTimestamp,
        version_number: 1,
      });
    });

    it('should create a dashboard version entry with current timestamp if not provided', () => {
      const entry = createDashboardVersion(mockDashboardYml, 2);

      expect(entry.content).toEqual({
        name: mockDashboardYml.name,
        description: mockDashboardYml.description,
        rows: mockDashboardYml.rows.map((row) => ({
          id: row.id,
          items: row.items,
          columnSizes: row.column_sizes, // Converted to camelCase
          rowHeight: row.row_height, // Converted to camelCase
        })),
      });
      expect(entry.version_number).toBe(2);
      expect(entry.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createInitialMetricVersionHistory', () => {
    it('should create initial version history with version 1', () => {
      const history = createInitialMetricVersionHistory(mockMetricYml, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: {
            name: mockMetricYml.name,
            description: mockMetricYml.description,
            timeFrame: mockMetricYml.time_frame,
            sql: mockMetricYml.sql,
            chartConfig: mockMetricYml.chart_config,
          },
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should match expected JSONB format', () => {
      const history = createInitialMetricVersionHistory(mockMetricYml, mockTimestamp);
      const json = JSON.stringify(history);
      const parsed = JSON.parse(json);

      expect(parsed['1']).toBeDefined();
      expect(parsed['1'].content.sql).toBe(mockMetricYml.sql);
      expect(parsed['1'].version_number).toBe(1);
    });
  });

  describe('createInitialDashboardVersionHistory', () => {
    it('should create initial version history with version 1', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardYml, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: {
            name: mockDashboardYml.name,
            description: mockDashboardYml.description,
            rows: mockDashboardYml.rows.map((row) => ({
              id: row.id,
              items: row.items,
              columnSizes: row.column_sizes,
              rowHeight: row.row_height,
            })),
          },
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should match expected JSONB format', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardYml, mockTimestamp);
      const json = JSON.stringify(history);
      const parsed = JSON.parse(json);

      expect(parsed['1']).toBeDefined();
      expect(parsed['1'].content.name).toBe(mockDashboardYml.name);
      expect(parsed['1'].version_number).toBe(1);
    });
  });

  describe('addMetricVersionToHistory', () => {
    it('should create initial version when history is null', () => {
      const history = addMetricVersionToHistory(null, mockMetricYml, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: {
            name: mockMetricYml.name,
            description: mockMetricYml.description,
            timeFrame: mockMetricYml.time_frame,
            sql: mockMetricYml.sql,
            chartConfig: mockMetricYml.chart_config,
          },
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should create initial version when history is undefined', () => {
      const history = addMetricVersionToHistory(undefined, mockMetricYml, mockTimestamp);

      expect(history['1']).toBeDefined();
      expect(history['1']?.version_number).toBe(1);
    });

    it('should create initial version when history is empty object', () => {
      const history = addMetricVersionToHistory({}, mockMetricYml, mockTimestamp);

      expect(history['1']).toBeDefined();
      expect(history['1']?.version_number).toBe(1);
    });

    it('should add version 2 to existing history', () => {
      const existingHistory: VersionHistory = {
        '1': createMetricVersion(mockMetricYml, 1, '2025-05-01T10:00:00.000Z'),
      };

      const updatedMetric = { ...mockMetricYml, name: 'Updated Revenue' };
      const history = addMetricVersionToHistory(existingHistory, updatedMetric, mockTimestamp);

      expect(Object.keys(history)).toHaveLength(2);
      expect(history['1']).toEqual(existingHistory['1']);
      expect(history['2']).toEqual({
        content: {
          name: updatedMetric.name,
          description: updatedMetric.description,
          timeFrame: updatedMetric.time_frame,
          sql: updatedMetric.sql,
          chartConfig: updatedMetric.chart_config,
        },
        updated_at: mockTimestamp,
        version_number: 2,
      });
    });

    it('should handle non-sequential version numbers', () => {
      const existingHistory: VersionHistory = {
        '1': createMetricVersion(mockMetricYml, 1),
        '3': createMetricVersion(mockMetricYml, 3),
        '5': createMetricVersion(mockMetricYml, 5),
      };

      const history = addMetricVersionToHistory(existingHistory, mockMetricYml, mockTimestamp);

      expect(history['6']).toBeDefined();
      expect(history['6']?.version_number).toBe(6);
    });
  });

  describe('addDashboardVersionToHistory', () => {
    it('should create initial version when history is null', () => {
      const history = addDashboardVersionToHistory(null, mockDashboardYml, mockTimestamp);

      expect(history).toEqual({
        '1': {
          content: {
            name: mockDashboardYml.name,
            description: mockDashboardYml.description,
            rows: mockDashboardYml.rows.map((row) => ({
              id: row.id,
              items: row.items,
              columnSizes: row.column_sizes,
              rowHeight: row.row_height,
            })),
          },
          updated_at: mockTimestamp,
          version_number: 1,
        },
      });
    });

    it('should add version 2 to existing history', () => {
      const existingHistory: VersionHistory = {
        '1': createDashboardVersion(mockDashboardYml, 1, '2025-05-01T10:00:00.000Z'),
      };

      const updatedDashboard = { ...mockDashboardYml, name: 'Updated Dashboard' };
      const history = addDashboardVersionToHistory(
        existingHistory,
        updatedDashboard,
        mockTimestamp
      );

      expect(Object.keys(history)).toHaveLength(2);
      expect(history['1']).toEqual(existingHistory['1']);
      expect(history['2']).toEqual({
        content: {
          name: updatedDashboard.name,
          description: updatedDashboard.description,
          rows: updatedDashboard.rows.map((row) => ({
            id: row.id,
            items: row.items,
            columnSizes: row.column_sizes,
            rowHeight: row.row_height,
          })),
        },
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
      const history: VersionHistory = {
        '1': createMetricVersion(mockMetricYml, 1),
        '2': createMetricVersion(mockMetricYml, 2),
        '3': createMetricVersion(mockMetricYml, 3),
      };

      expect(getLatestVersionNumber(history)).toBe(3);
    });

    it('should handle non-sequential version numbers', () => {
      const history: VersionHistory = {
        '1': createMetricVersion(mockMetricYml, 1),
        '5': createMetricVersion(mockMetricYml, 5),
        '3': createMetricVersion(mockMetricYml, 3),
      };

      expect(getLatestVersionNumber(history)).toBe(5);
    });
  });

  describe('getLatestVersion', () => {
    it('should return null for null history', () => {
      expect(getLatestVersion(null)).toBeNull();
    });

    it('should return null for empty history', () => {
      expect(getLatestVersion({})).toBeNull();
    });

    it('should return latest version entry for metric', () => {
      const latestMetric = { ...mockMetricYml, name: 'Latest Version' };
      const history: VersionHistory = {
        '1': createMetricVersion(mockMetricYml, 1),
        '2': createMetricVersion(mockMetricYml, 2),
        '3': createMetricVersion(latestMetric, 3, mockTimestamp),
      };

      const latest = getLatestVersion(history);
      expect(latest).toEqual({
        content: {
          name: latestMetric.name,
          description: latestMetric.description,
          timeFrame: latestMetric.time_frame,
          sql: latestMetric.sql,
          chartConfig: latestMetric.chart_config,
        },
        updated_at: mockTimestamp,
        version_number: 3,
      });
    });

    it('should return latest version entry for dashboard', () => {
      const latestDashboard = { ...mockDashboardYml, name: 'Latest Dashboard' };
      const history: VersionHistory = {
        '1': createDashboardVersion(mockDashboardYml, 1),
        '2': createDashboardVersion(latestDashboard, 2, mockTimestamp),
      };

      const latest = getLatestVersion(history);
      expect(latest).toEqual({
        content: {
          name: latestDashboard.name,
          description: latestDashboard.description,
          rows: latestDashboard.rows.map((row) => ({
            id: row.id,
            items: row.items,
            columnSizes: row.column_sizes,
            rowHeight: row.row_height,
          })),
        },
        updated_at: mockTimestamp,
        version_number: 2,
      });
    });
  });

  // getLatestDashboardVersion test removed - now using unified getLatestVersion

  describe('validateMetricYml', () => {
    it('should validate correct metric YML', () => {
      const yml = {
        name: 'Test Metric',
        description: 'Test description',
        time_frame: '2024', // Note: time_frame not timeFrame
        sql: 'SELECT * FROM test',
        chart_config: { selectedChartType: 'metric' as const, columnLabelFormats: {} },
      };

      const validated = validateMetricYml(yml);

      expect(validated).toEqual(yml);
    });

    it('should handle optional description', () => {
      const yml = {
        name: 'Test Metric',
        time_frame: '2024',
        sql: 'SELECT * FROM test',
        chart_config: { selectedChartType: 'metric' as const, columnLabelFormats: {} },
      };

      const validated = validateMetricYml(yml);

      expect(validated.description).toBeUndefined();
    });
  });

  describe('validateDashboardYml', () => {
    it('should validate correct dashboard YML', () => {
      const yml = {
        name: 'Test Dashboard',
        description: 'Test description',
        rows: [
          {
            id: 1,
            items: [{ id: '550e8400-e29b-41d4-a716-446655440000' }], // Valid UUID
            column_sizes: [12], // Note: column_sizes not columnSizes
          },
        ],
      };

      const validated = validateDashboardYml(yml);

      expect(validated).toEqual(yml);
    });

    it('should handle optional description', () => {
      const yml = {
        name: 'Test Dashboard',
        rows: [
          {
            id: 1,
            items: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
            column_sizes: [12],
          },
        ],
      };

      const validated = validateDashboardYml(yml);

      expect(validated.description).toBeUndefined();
    });
  });

  describe('JSONB Compatibility - Rust VersionHistory Structure', () => {
    it('should produce valid JSONB for metric version history', () => {
      const history = createInitialMetricVersionHistory(mockMetricYml, mockTimestamp);
      const updatedHistory = addMetricVersionToHistory(
        history,
        { ...mockMetricYml, name: 'Updated' },
        '2025-05-03T10:00:00.000Z'
      );

      const json = JSON.stringify(updatedHistory);
      const parsed = JSON.parse(json);

      // Verify structure matches Rust VersionHistory format
      expect(Object.keys(parsed).sort()).toEqual(['1', '2']);
      expect(parsed['1'].version_number).toBe(1);
      expect(parsed['2'].version_number).toBe(2);
      expect(parsed['1'].content.name).toBe('Total Revenue');
      expect(parsed['2'].content.name).toBe('Updated');
      expect(parsed['1'].content.timeFrame).toBe('Q2 2023 - Q1 2024');
    });

    it('should produce valid JSONB for dashboard version history', () => {
      const history = createInitialDashboardVersionHistory(mockDashboardYml, mockTimestamp);
      const updatedHistory = addDashboardVersionToHistory(
        history,
        { ...mockDashboardYml, name: 'Updated Dashboard' },
        '2025-05-03T10:00:00.000Z'
      );

      const json = JSON.stringify(updatedHistory);
      const parsed = JSON.parse(json);

      // Verify structure matches Rust VersionHistory format
      expect(Object.keys(parsed).sort()).toEqual(['1', '2']);
      expect(parsed['1'].version_number).toBe(1);
      expect(parsed['2'].version_number).toBe(2);
      expect(parsed['1'].content.name).toBe('Revenue Dashboard');
      expect(parsed['2'].content.name).toBe('Updated Dashboard');
      expect(parsed['1'].content.rows[0].columnSizes).toEqual([12]);
    });
  });
});
