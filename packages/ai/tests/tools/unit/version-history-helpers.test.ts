import { describe, expect, it } from 'vitest';
import {
  addDashboardVersionToHistory,
  addMetricVersionToHistory,
  createInitialDashboardVersionHistory,
  createInitialMetricVersionHistory,
} from '../../../src/tools/visualization-tools/version-history-helpers';
import type {
  DashboardYml,
  MetricYml,
  VersionHistory,
} from '../../../src/tools/visualization-tools/version-history-types';

describe('Version History Helper Functions', () => {
  describe('Metric Version History JSONB Format', () => {
    it('should create version history matching the expected database format', () => {
      const metricYml: MetricYml = {
        sql: 'WITH revenue_data AS (\n  SELECT\n    tsr.metric_totalsalesrevenue\n  FROM postgres.ont_ont.total_sales_revenue AS tsr\n  WHERE\n    (tsr.year = 2023 AND tsr.quarter >= 2)\n    OR (tsr.year = 2024 AND tsr.quarter = 1)\n)\nSELECT\n  SUM(rd.metric_totalsalesrevenue) AS total_revenue\nFROM revenue_data AS rd\n',
        name: 'Total Revenue (Q2 2023 - Q1 2024)',
        timeFrame: 'Q2 2023 - Q1 2024',
        chartConfig: {
          metricColumnId: 'total_revenue',
          selectedChartType: 'metric' as const,
          columnLabelFormats: {
            total_revenue: {
              style: 'currency' as const,
              currency: 'USD',
              columnType: 'number' as const,
              numberSeparatorStyle: ',',
              replaceMissingDataWith: 0,
            },
          },
        },
        description: 'What is the total sales revenue for the period Q2 2023 to Q1 2024?',
      };

      const timestamp = '2025-05-02T17:18:46.207629Z';
      const history = createInitialMetricVersionHistory(metricYml, timestamp);

      // Check it matches expected format
      expect(history).toEqual({
        '1': {
          content: {
            name: metricYml.name,
            description: metricYml.description,
            timeFrame: metricYml.timeFrame,
            sql: metricYml.sql,
            chartConfig: metricYml.chartConfig,
          },
          updated_at: timestamp,
          version_number: 1,
        },
      });

      // Verify it can be serialized/deserialized as JSONB
      const jsonString = JSON.stringify(history);
      const parsed: VersionHistory = JSON.parse(jsonString);

      expect(parsed['1']?.content.name).toBe('Total Revenue (Q2 2023 - Q1 2024)');
      expect(parsed['1']?.version_number).toBe(1);
      expect(parsed['1']?.updated_at).toBe(timestamp);
    });

    it('should handle multiple versions correctly', () => {
      const initialMetric: MetricYml = {
        name: 'Initial Metric',
        sql: 'SELECT * FROM sales',
        timeFrame: '2024',
        chartConfig: { selectedChartType: 'metric' as const, columnLabelFormats: {} },
        description: 'Initial description',
      };

      const updatedMetric: MetricYml = {
        name: 'Updated Metric',
        sql: 'SELECT SUM(amount) FROM sales',
        timeFrame: '2024',
        chartConfig: { selectedChartType: 'bar' as const, columnLabelFormats: {} },
        description: 'Updated description',
      };

      let history = createInitialMetricVersionHistory(initialMetric, '2025-01-01T00:00:00.000Z');
      history = addMetricVersionToHistory(history, updatedMetric, '2025-01-02T00:00:00.000Z');

      // Verify structure
      expect(Object.keys(history).sort()).toEqual(['1', '2']);
      expect(history['1']?.content.name).toBe('Initial Metric');
      expect(history['2']?.content.name).toBe('Updated Metric');
      expect(history['2']?.version_number).toBe(2);
    });
  });

  describe('Dashboard Version History JSONB Format', () => {
    it('should create version history matching the expected database format', () => {
      const dashboardYml: DashboardYml = {
        name: 'Quarterly Revenue Report (Previous 4 Quarters)',
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
        description:
          'A dashboard highlighting key revenue metrics for the four quarters Q2 2023 - Q1 2024',
      };

      const timestamp = '2025-05-02T17:19:01.230094Z';
      const history = createInitialDashboardVersionHistory(dashboardYml, timestamp);

      // Check it matches expected format
      expect(history).toEqual({
        '1': {
          content: {
            name: dashboardYml.name,
            description: dashboardYml.description,
            rows: dashboardYml.rows.map((row) => ({
              id: row.id,
              items: row.items,
              columnSizes: row.columnSizes,
              rowHeight: row.rowHeight,
            })),
          },
          updated_at: timestamp,
          version_number: 1,
        },
      });

      // Verify it can be serialized/deserialized as JSONB
      const jsonString = JSON.stringify(history);
      const parsed: VersionHistory = JSON.parse(jsonString);

      expect(parsed['1']?.content.name).toBe('Quarterly Revenue Report (Previous 4 Quarters)');
      expect(parsed['1']?.content.rows).toHaveLength(2);
      expect(parsed['1']?.version_number).toBe(1);
    });

    it('should handle multiple versions correctly', () => {
      const initialDashboard: DashboardYml = {
        name: 'Initial Dashboard',
        rows: [{ id: 1, items: [{ id: 'metric-1' }], columnSizes: [12] }],
        description: 'Initial description',
      };

      const updatedDashboard: DashboardYml = {
        name: 'Updated Dashboard',
        rows: [
          { id: 1, items: [{ id: 'metric-1' }], columnSizes: [12] },
          { id: 2, items: [{ id: 'metric-2' }, { id: 'metric-3' }], columnSizes: [6, 6] },
        ],
        description: 'Updated description',
      };

      let history = createInitialDashboardVersionHistory(
        initialDashboard,
        '2025-01-01T00:00:00.000Z'
      );
      history = addDashboardVersionToHistory(history, updatedDashboard, '2025-01-02T00:00:00.000Z');

      // Verify structure
      expect(Object.keys(history).sort()).toEqual(['1', '2']);
      expect(history['1']?.content.name).toBe('Initial Dashboard');
      expect(history['2']?.content.name).toBe('Updated Dashboard');
      expect(history['2']?.content.rows).toHaveLength(2);
    });
  });
});
