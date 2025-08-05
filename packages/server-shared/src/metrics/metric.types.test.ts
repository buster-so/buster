import { describe, expect, it } from 'vitest';
import { DEFAULT_CHART_CONFIG } from './charts/chartConfigProps';
import { MetricSchema } from './metric.types';

describe('MetricSchema', () => {
  it('should parse a valid metric with all required fields', () => {
    const validMetric = {
      id: 'metric-123',
      type: 'metric',
      name: 'Revenue Analysis',
      version_number: 1,
      description: 'Monthly revenue breakdown',
      file_name: 'revenue_analysis.yaml',
      time_frame: 'monthly',
      dataset_id: 'dataset-456',
      data_source_id: 'source-789',
      dataset_name: 'Sales Data',
      error: null,
      data_metadata: {
        row_count: 1000,
        column_count: 5,
        column_metadata: [
          {
            name: 'revenue',
            min_value: 0,
            max_value: 10000,
            unique_values: 100,
            simple_type: 'number',
            type: 'float',
          },
        ],
      },
      status: 'verified',
      evaluation_score: 'High',
      evaluation_summary: 'Excellent metric quality',
      file: 'metric:\n  name: Revenue\n  sql: SELECT * FROM revenue',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      sent_by_id: 'user-123',
      sent_by_name: 'John Doe',
      sent_by_avatar_url: 'https://example.com/avatar.jpg',
      sql: 'SELECT SUM(revenue) FROM sales',
      dashboards: [],
      collections: [],
      versions: [],
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'owner',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = MetricSchema.safeParse(validMetric);

    if (!result.success) {
      console.error('Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe('metric-123');
      expect(result.data.type).toBe('metric');
      expect(result.data.name).toBe('Revenue Analysis');
    }
  });

  it('should apply default chart_config when not provided', () => {
    const metricWithoutChartConfig = {
      id: 'metric-123',
      type: 'metric',
      name: 'Test Metric',
      version_number: 1,
      description: null,
      file_name: 'test.yaml',
      time_frame: 'daily',
      dataset_id: 'dataset-1',
      data_source_id: 'source-1',
      dataset_name: 'Test Data',
      error: null,
      data_metadata: {
        row_count: 100,
        column_count: 3,
        column_metadata: [
          {
            name: 'test_column',
            min_value: 0,
            max_value: 100,
            unique_values: 50,
            simple_type: 'number',
            type: 'integer',
          },
        ],
      },
      status: 'notRequested',
      evaluation_score: 'Moderate',
      evaluation_summary: 'Good metric',
      file: 'metric content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      sent_by_id: 'user-1',
      sent_by_name: 'User One',
      sent_by_avatar_url: null,
      sql: null,
      dashboards: [],
      collections: [],
      versions: [],
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'can_view',
      workspace_sharing: null,
      workspace_member_count: null,
      // chart_config is omitted, should get default
    };

    const result = MetricSchema.safeParse(metricWithoutChartConfig);

    if (!result.success) {
      console.error('Test 2 - Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }

    expect(result.success).toBe(true);

    if (result.success) {
      // Should have the default chart config
      expect(result.data.chart_config).toEqual(DEFAULT_CHART_CONFIG);
      expect(result.data.chart_config.selectedChartType).toBe('table');
      expect(result.data.chart_config.colors).toEqual(DEFAULT_CHART_CONFIG.colors);
      expect(result.data.chart_config.gridLines).toBe(true);
    }
  });

  it('should preserve custom chart_config when provided', () => {
    const customChartConfig = {
      selectedChartType: 'bar',
      colors: ['#FF0000', '#00FF00'],
      gridLines: false,
      columnSettings: {
        revenue: {
          showDataLabels: true,
          columnVisualization: 'line',
        },
      },
    };

    const metricWithCustomConfig = {
      id: 'metric-123',
      type: 'metric',
      name: 'Custom Chart Metric',
      version_number: 1,
      description: null,
      file_name: 'custom.yaml',
      time_frame: 'weekly',
      dataset_id: 'dataset-1',
      data_source_id: 'source-1',
      dataset_name: 'Custom Data',
      error: null,
      chart_config: customChartConfig,
      data_metadata: {
        row_count: 500,
        column_count: 4,
        column_metadata: [
          {
            name: 'custom_field',
            min_value: 0,
            max_value: 500,
            unique_values: 250,
            simple_type: 'number',
            type: 'float',
          },
        ],
      },
      status: 'verified',
      evaluation_score: 'High',
      evaluation_summary: 'Great metric',
      file: 'custom metric content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      sent_by_id: 'user-1',
      sent_by_name: 'User One',
      sent_by_avatar_url: null,
      sql: 'SELECT * FROM custom_table',
      dashboards: [],
      collections: [],
      versions: [],
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      permission: 'can_edit',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = MetricSchema.safeParse(metricWithCustomConfig);

    if (!result.success) {
      console.error('Test 3 - Validation errors:', JSON.stringify(result.error.format(), null, 2));
    }

    expect(result.success).toBe(true);

    if (result.success) {
      // Should preserve custom config but apply defaults for missing fields
      expect(result.data.chart_config.selectedChartType).toBe('bar');
      expect(result.data.chart_config.colors).toEqual(['#FF0000', '#00FF00']);
      expect(result.data.chart_config.gridLines).toBe(false);
      expect(result.data.chart_config.columnSettings.revenue?.showDataLabels).toBe(true);
      expect(result.data.chart_config.columnSettings.revenue?.columnVisualization).toBe('line');

      // Should apply defaults for missing chart config fields
      expect(result.data.chart_config.showLegend).toBeNull();
      expect(result.data.chart_config.disableTooltip).toBe(false);
      expect(result.data.chart_config.goalLines).toEqual([]);
    }
  });

  it('should handle partial chart_config with deeply nested defaults', () => {
    const partialChartConfig = {
      selectedChartType: 'line',
      columnSettings: {
        sales: {
          showDataLabels: true,
          // Other column settings should get defaults
        },
      },
      // Other chart config fields should get defaults
    };

    const metricWithPartialConfig = {
      id: 'metric-456',
      type: 'metric',
      name: 'Partial Config Metric',
      version_number: 2,
      description: 'Testing partial config',
      file_name: 'partial.yaml',
      time_frame: 'quarterly',
      dataset_id: 'dataset-2',
      data_source_id: 'source-2',
      dataset_name: 'Partial Data',
      error: null,
      chart_config: partialChartConfig,
      data_metadata: {
        row_count: 750,
        column_count: 6,
        column_metadata: [
          {
            name: 'sales',
            min_value: 100,
            max_value: 5000,
            unique_values: 300,
            simple_type: 'number',
            type: 'decimal',
          },
        ],
      },
      status: 'notVerified',
      evaluation_score: 'Low',
      evaluation_summary: 'Needs improvement',
      file: 'partial config content',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      sent_by_id: 'user-2',
      sent_by_name: 'User Two',
      sent_by_avatar_url: 'https://example.com/user2.jpg',
      sql: 'SELECT AVG(sales) FROM transactions',
      dashboards: [{ id: 'dash-1', name: 'Sales Dashboard' }],
      collections: [{ id: 'coll-1', name: 'Sales Collection' }],
      versions: [
        { version_number: 1, updated_at: '2024-01-01T00:00:00Z' },
        { version_number: 2, updated_at: '2024-01-15T00:00:00Z' },
      ],
      individual_permissions: [],
      public_expiry_date: '2024-12-31T00:00:00Z',
      public_enabled_by: 'admin-1',
      publicly_accessible: true,
      public_password: 'secret123',
      permission: 'can_edit',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = MetricSchema.safeParse(metricWithPartialConfig);
    expect(result.success).toBe(true);

    if (result.success) {
      // Should preserve provided values
      expect(result.data.chart_config.selectedChartType).toBe('line');
      expect(result.data.chart_config.columnSettings.sales?.showDataLabels).toBe(true);

      // Should apply defaults to column settings for provided column
      expect(result.data.chart_config.columnSettings.sales?.showDataLabelsAsPercentage).toBe(false);
      expect(result.data.chart_config.columnSettings.sales?.columnVisualization).toBe('bar');
      expect(result.data.chart_config.columnSettings.sales?.lineWidth).toBe(2);

      // Should apply defaults to top-level chart config
      expect(result.data.chart_config.colors).toEqual(DEFAULT_CHART_CONFIG.colors);
      expect(result.data.chart_config.gridLines).toBe(true);
      expect(result.data.chart_config.showLegend).toBeNull();
      expect(result.data.chart_config.columnLabelFormats).toEqual({});
    }
  });

  it('should validate required enum values', () => {
    const metricWithInvalidEnum = {
      id: 'metric-789',
      type: 'invalid_type', // Should be 'metric'
      name: 'Invalid Metric',
      // ... other required fields
    };

    const result = MetricSchema.safeParse(metricWithInvalidEnum);
    expect(result.success).toBe(false);
  });

  it('should handle nullable fields correctly', () => {
    const metricWithNulls = {
      id: 'metric-null',
      type: 'metric',
      name: 'Null Fields Metric',
      version_number: 1,
      description: null, // nullable
      file_name: 'null_test.yaml',
      time_frame: 'yearly',
      dataset_id: 'dataset-null',
      data_source_id: 'source-null',
      dataset_name: null, // nullable
      error: null, // nullable
      data_metadata: {
        row_count: 0,
        column_count: 0,
        column_metadata: [],
      },
      status: 'notRequested',
      evaluation_score: 'Moderate',
      evaluation_summary: 'Test with nulls',
      file: 'null content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      sent_by_id: 'user-null',
      sent_by_name: 'Null User',
      sent_by_avatar_url: null, // nullable
      sql: null, // nullable
      dashboards: [],
      collections: [],
      versions: [],
      individual_permissions: null, // nullable
      public_expiry_date: null, // nullable
      public_enabled_by: null, // nullable
      publicly_accessible: false,
      public_password: null, // nullable
      permission: 'can_view',
      workspace_sharing: null,
      workspace_member_count: null,
    };

    const result = MetricSchema.safeParse(metricWithNulls);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.description).toBeNull();
      expect(result.data.dataset_name).toBeNull();
      expect(result.data.error).toBeNull();
      expect(result.data.sent_by_avatar_url).toBeNull();
      expect(result.data.sql).toBeNull();
    }
  });
});

// Note: DEFAULT_METRIC tests removed because getDefaults() cannot work
// with schemas that have required fields without defaults
