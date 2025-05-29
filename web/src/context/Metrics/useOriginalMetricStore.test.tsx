import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { DEFAULT_CHART_CONFIG } from '@/api/asset_interfaces/metric/defaults';
import { VerificationStatus } from '@/api/asset_interfaces/share';
import { ShareRole } from '@/api/asset_interfaces/share/shareInterfaces';
import { act, renderHook } from '@testing-library/react';
import { useOriginalMetricStore } from './useOriginalMetricStore';

describe('useOriginalMetricStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useOriginalMetricStore.setState({ originalMetrics: {} });
  });

  it('should correctly set and get a metric', () => {
    const mockMetric: IBusterMetric = {
      id: 'test-metric-1',
      type: 'metric' as const,
      name: 'Test Metric',
      version_number: 1,
      description: '',
      time_frame: '',
      sql: null,
      dataset_id: 'test-dataset',
      dataset_name: null,
      error: null,
      data_metadata: null,
      status: VerificationStatus.NOT_REQUESTED,
      evaluation_score: 'Moderate',
      evaluation_summary: '',
      file_name: 'test.yaml',
      file: '',
      data_source_id: 'test-source',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      sent_by_id: 'user-1',
      sent_by_name: 'Test User',
      permission: ShareRole.CAN_VIEW,
      sent_by_avatar_url: null,
      dashboards: [],
      collections: [],
      chart_config: DEFAULT_CHART_CONFIG,
      individual_permissions: null,
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null,
      versions: []
    };

    // Use the hook
    const { result } = renderHook(() => useOriginalMetricStore());

    // Add a metric
    act(() => {
      result.current.setOriginalMetric(mockMetric);
    });

    // Verify the metric was added correctly
    expect(result.current.getOriginalMetric('test-metric-1')).toEqual(mockMetric);
  });
});
