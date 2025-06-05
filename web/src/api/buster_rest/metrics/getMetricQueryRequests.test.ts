import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { prefetchGetMetricDataClient } from './getMetricQueryRequests';
import { getMetricData } from './requests';

// Mock the requests module
vi.mock('./requests', () => ({
  getMetricData: vi.fn()
}));

describe('prefetchGetMetricDataClient', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
  });

  it('should prefetch metric data when no existing data is found', async () => {
    // Setup
    const mockId = 'test-metric-id';
    const mockVersionNumber = 1;
    const mockMetricData = { id: mockId, data: 'test-data' };

    // Mock the getMetricData function
    (getMetricData as any).mockResolvedValue(mockMetricData);

    // Execute
    await prefetchGetMetricDataClient(
      { id: mockId, version_number: mockVersionNumber },
      queryClient
    );

    // Get the query key
    const queryKey = metricsQueryKeys.metricsGetData(mockId, mockVersionNumber).queryKey;

    // Verify
    expect(getMetricData).toHaveBeenCalledWith({
      id: mockId,
      version_number: mockVersionNumber
    });
    expect(queryClient.getQueryData(queryKey)).toEqual(mockMetricData);
  });
});
