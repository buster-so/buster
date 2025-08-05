import { type BusterDashboard, type BusterDashboardResponse } from '@/api/asset_interfaces';
import { createMockMetric } from './metric';

interface DashboardMockResponse {
  dashboard: BusterDashboard;
  response: BusterDashboardResponse;
}

const createMockDashboardRow = (startIndex: number, metrics: string[], columnSizes: number[]) => ({
  id: `row-${startIndex}`,
  columnSizes,
  items: metrics.map((metricId) => ({ id: metricId }))
});

export const generateMockDashboard = (
  numMetrics: number,
  dashboardId = '123'
): DashboardMockResponse => {
  // Generate the specified number of metrics
  const metrics = Array.from({ length: numMetrics }, (_, i) => createMockMetric(`${i + 1}`));
  const metricIds = metrics.map((metric) => metric.id);

  // Create rows based on number of metrics
  const rows = [];
  let currentIndex = 0;

  while (currentIndex < metricIds.length) {
    const remainingMetrics = metricIds.length - currentIndex;

    if (remainingMetrics >= 4) {
      // Add a row with 4 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 4),
          [3, 3, 3, 3]
        )
      );
      currentIndex += 4;
    } else if (remainingMetrics >= 3) {
      // Add a row with 3 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 3),
          [4, 4, 4]
        )
      );
      currentIndex += 3;
    } else if (remainingMetrics >= 2) {
      // Add a row with 2 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 2),
          [6, 6]
        )
      );
      currentIndex += 2;
    } else {
      // Add a row with 1 column
      rows.push(
        createMockDashboardRow(rows.length + 1, metricIds.slice(currentIndex, currentIndex + 1), [
          12
        ])
      );
      currentIndex += 1;
    }
  }

  const dashboard: BusterDashboard = {
    id: dashboardId,
    name: 'Mock Dashboard',
    file: `title: Mock Dashboard
description: A sample dashboard configuration
version: 1.0
layout:
  rows:
    - id: row1
      columns:
        - width: 6
          metric_id: metric-1
        - width: 6 
          metric_id: metric-2
    - id: row2
      columns:
        - width: 12
          metric_id: metric-3
theme: light
refresh_interval: 300`,
    file_name: 'mock-file.yaml',
    version_number: 1,
    description: null,
    created_at: new Date().toISOString(),
    created_by: 'user-123',
    updated_at: null,
    updated_by: 'user-123',
    deleted_at: null,
    status: 'notRequested',
    config: {
      rows
    }
  };

  const response: BusterDashboardResponse = {
    access: 'can_edit',
    metrics: Object.fromEntries(metrics.map((metric) => [metric.id, metric])),
    dashboard,
    permission: 'can_edit',
    public_password: null,
    individual_permissions: null,
    public_expiry_date: null,
    public_enabled_by: null,
    publicly_accessible: false,
    collections: [],
    versions: [],
    workspace_sharing: 'none',
    workspace_member_count: 20
  };

  return { dashboard, response };
};

// Example usage:
// const { dashboard, response } = generateMockDashboard(12);

export const MOCK_DASHBOARD_RESPONSE = generateMockDashboard(3).response;
