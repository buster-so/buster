import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProviderForOrganization } from '../storage';
import type { StorageProvider } from '../storage/types';
import {
  batchCheckCacheExists,
  checkCacheExists,
  generateCacheKey,
  getCachedMetricData,
  setCachedMetricData,
} from './metric-cache';

vi.mock('../storage');

describe('Metric Cache', () => {
  let mockProvider: {
    upload: Mock;
    download: Mock;
    delete: Mock;
    exists: Mock;
    list: Mock;
    getSignedUrl: Mock;
    testConnection: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    mockProvider = {
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      list: vi.fn(),
      getSignedUrl: vi.fn(),
      testConnection: vi.fn(),
    };

    (getProviderForOrganization as Mock).mockResolvedValue(
      mockProvider as unknown as StorageProvider
    );
  });

  describe('generateCacheKey', () => {
    it('should generate correct cache key format', () => {
      const key = generateCacheKey('org-123', 'metric-456', 'report-789');
      expect(key).toBe('static-report-assets/org-123/metric-456-report-789.json');
    });

    it('should handle special characters in IDs', () => {
      const key = generateCacheKey('org_123', 'metric.456', 'report-789');
      expect(key).toBe('static-report-assets/org_123/metric.456-report-789.json');
    });
  });

  describe('checkCacheExists', () => {
    it('should return true when cache exists', async () => {
      mockProvider.exists.mockResolvedValue(true);

      const result = await checkCacheExists('org-123', 'metric-456', 'report-789');

      expect(result).toBe(true);
      expect(getProviderForOrganization).toHaveBeenCalledWith('org-123');
      expect(mockProvider.exists).toHaveBeenCalledWith(
        'static-report-assets/org-123/metric-456-report-789.json'
      );
    });

    it('should return false when cache does not exist', async () => {
      mockProvider.exists.mockResolvedValue(false);

      const result = await checkCacheExists('org-123', 'metric-456', 'report-789');

      expect(result).toBe(false);
    });

    it('should return false and log error on provider error', async () => {
      (getProviderForOrganization as Mock).mockRejectedValue(new Error('Provider error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkCacheExists('org-123', 'metric-456', 'report-789');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error checking cache existence:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return false and log error when exists() fails', async () => {
      mockProvider.exists.mockRejectedValue(new Error('Storage error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await checkCacheExists('org-123', 'metric-456', 'report-789');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error checking cache existence:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCachedMetricData', () => {
    const mockMetricData: MetricDataResponse = {
      metricId: 'metric-456',
      data: [
        { timestamp: '2024-01-15', value: 42 },
        { timestamp: '2024-01-16', value: 100 },
      ],
    };

    it('should return cached data when available', async () => {
      mockProvider.download.mockResolvedValue({
        success: true,
        data: Buffer.from(JSON.stringify(mockMetricData)),
        contentType: 'application/json',
        size: 100,
      });

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const result = await getCachedMetricData('org-123', 'metric-456', 'report-789');

      expect(result).toEqual(mockMetricData);
      expect(mockProvider.download).toHaveBeenCalledWith(
        'static-report-assets/org-123/metric-456-report-789.json'
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[metric-cache] Cache hit',
        expect.objectContaining({
          organizationId: 'org-123',
          metricId: 'metric-456',
          reportId: 'report-789',
          rowCount: 2,
        })
      );

      consoleInfoSpy.mockRestore();
    });

    it('should set metricId from parameter', async () => {
      const dataWithoutMetricId = {
        data: [{ timestamp: '2024-01-15', value: 42 }],
      };

      mockProvider.download.mockResolvedValue({
        success: true,
        data: Buffer.from(JSON.stringify(dataWithoutMetricId)),
        contentType: 'application/json',
        size: 100,
      });

      const result = await getCachedMetricData('org-123', 'metric-999', 'report-789');

      expect(result?.metricId).toBe('metric-999');
    });

    it('should return null on cache miss', async () => {
      mockProvider.download.mockResolvedValue({
        success: false,
        error: 'Not found',
      });

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const result = await getCachedMetricData('org-123', 'metric-456', 'report-789');

      expect(result).toBeNull();
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[metric-cache] Cache miss',
        expect.objectContaining({
          organizationId: 'org-123',
          metricId: 'metric-456',
          reportId: 'report-789',
        })
      );

      consoleInfoSpy.mockRestore();
    });

    it('should return null when data is undefined', async () => {
      mockProvider.download.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await getCachedMetricData('org-123', 'metric-456', 'report-789');

      expect(result).toBeNull();
    });

    it('should return null and log error on JSON parse error', async () => {
      mockProvider.download.mockResolvedValue({
        success: true,
        data: Buffer.from('invalid json'),
        contentType: 'application/json',
        size: 12,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getCachedMetricData('org-123', 'metric-456', 'report-789');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error fetching cached data:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null and log error on provider error', async () => {
      (getProviderForOrganization as Mock).mockRejectedValue(new Error('Provider error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getCachedMetricData('org-123', 'metric-456', 'report-789');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error fetching cached data:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setCachedMetricData', () => {
    const mockMetricData: MetricDataResponse = {
      metricId: 'metric-456',
      data: [
        { timestamp: '2024-01-15', value: 42 },
        { timestamp: '2024-01-16', value: 100 },
      ],
    };

    it('should successfully cache metric data', async () => {
      mockProvider.upload.mockResolvedValue({
        success: true,
        key: 'test-key',
        size: 100,
      });

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const dateSpy = vi
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2024-01-15T12:00:00.000Z');

      await setCachedMetricData('org-123', 'metric-456', 'report-789', mockMetricData);

      expect(mockProvider.upload).toHaveBeenCalledWith(
        'static-report-assets/org-123/metric-456-report-789.json',
        Buffer.from(JSON.stringify(mockMetricData)),
        {
          contentType: 'application/json',
          metadata: {
            'organization-id': 'org-123',
            'metric-id': 'metric-456',
            'report-id': 'report-789',
            'metric-version': 'unversioned',
            'row-count': '2',
            'cached-at': '2024-01-15T12:00:00.000Z',
          },
        }
      );

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[metric-cache] Successfully cached metric data',
        expect.objectContaining({
          organizationId: 'org-123',
          metricId: 'metric-456',
          reportId: 'report-789',
          sizeBytes: Buffer.from(JSON.stringify(mockMetricData)).length,
        })
      );

      consoleInfoSpy.mockRestore();
      dateSpy.mockRestore();
    });

    it('should handle empty data array', async () => {
      const emptyData: MetricDataResponse = {
        metricId: 'metric-456',
        data: [],
      };

      mockProvider.upload.mockResolvedValue({
        success: true,
        key: 'test-key',
        size: 100,
      });

      await setCachedMetricData('org-123', 'metric-456', 'report-789', emptyData);

      expect(mockProvider.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            'metric-version': 'unversioned',
            'row-count': '0',
          }),
        })
      );
    });

    it('should handle undefined data array', async () => {
      const undefinedData: MetricDataResponse = {
        metricId: 'metric-456',
      };

      mockProvider.upload.mockResolvedValue({
        success: true,
        key: 'test-key',
        size: 100,
      });

      await setCachedMetricData('org-123', 'metric-456', 'report-789', undefinedData);

      expect(mockProvider.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            'metric-version': 'unversioned',
            'row-count': '0',
          }),
        })
      );
    });

    it('should log error on upload failure', async () => {
      mockProvider.upload.mockResolvedValue({
        success: false,
        key: 'test-key',
        error: 'Upload failed',
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await setCachedMetricData('org-123', 'metric-456', 'report-789', mockMetricData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Failed to cache metric data:',
        'Upload failed'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not throw on provider error', async () => {
      (getProviderForOrganization as Mock).mockRejectedValue(new Error('Provider error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        setCachedMetricData('org-123', 'metric-456', 'report-789', mockMetricData)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error caching metric data:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not throw on upload exception', async () => {
      mockProvider.upload.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        setCachedMetricData('org-123', 'metric-456', 'report-789', mockMetricData)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[metric-cache] Error caching metric data:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('batchCheckCacheExists', () => {
    it('should check multiple cache entries without version', async () => {
      // Setup function-based mocking to control return values per key
      mockProvider.exists.mockImplementation(async (key: string) => {
        if (key.includes('metric-1')) return true;
        if (key.includes('metric-2')) return false; // both versioned and legacy return false
        if (key.includes('metric-3')) return true;
        return false;
      });

      const pairs = [
        { metricId: 'metric-1', reportId: 'report-1' },
        { metricId: 'metric-2', reportId: 'report-2' },
        { metricId: 'metric-3', reportId: 'report-3' },
      ];

      const results = await batchCheckCacheExists('org-123', pairs);

      expect(results.size).toBe(3);
      expect(results.get('metric-1-report-1')).toBe(true);
      expect(results.get('metric-2-report-2')).toBe(false);
      expect(results.get('metric-3-report-3')).toBe(true);
      expect(mockProvider.exists).toHaveBeenCalledTimes(4); // metric-2 will check both primary and legacy
    });

    it('should process in batches', async () => {
      // Create 25 pairs to test batching (BATCH_SIZE = 10)
      const pairs = Array.from({ length: 25 }, (_, i) => ({
        metricId: `metric-${i}`,
        reportId: `report-${i}`,
      }));

      mockProvider.exists.mockResolvedValue(true);

      const results = await batchCheckCacheExists('org-123', pairs);

      expect(results.size).toBe(25);
      expect(mockProvider.exists).toHaveBeenCalledTimes(25);

      // Verify all results are true
      for (let i = 0; i < 25; i++) {
        expect(results.get(`metric-${i}-report-${i}`)).toBe(true);
      }
    });

    it('should handle empty array', async () => {
      const results = await batchCheckCacheExists('org-123', []);

      expect(results.size).toBe(0);
      expect(mockProvider.exists).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockProvider.exists
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce(true);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const pairs = [
        { metricId: 'metric-1', reportId: 'report-1' },
        { metricId: 'metric-2', reportId: 'report-2' },
        { metricId: 'metric-3', reportId: 'report-3' },
      ];

      const results = await batchCheckCacheExists('org-123', pairs);

      expect(results.get('metric-1-report-1')).toBe(true);
      expect(results.get('metric-2-report-2')).toBe(false); // Error defaults to false
      expect(results.get('metric-3-report-3')).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('should maintain correct key format', async () => {
      mockProvider.exists.mockResolvedValue(true);

      const pairs = [
        { metricId: 'metric.with.dots', reportId: 'report_with_underscores' },
        { metricId: 'metric-with-dashes', reportId: 'report-123' },
      ];

      const results = await batchCheckCacheExists('org-123', pairs);

      expect(results.get('metric.with.dots-report_with_underscores')).toBe(true);
      expect(results.get('metric-with-dashes-report-123')).toBe(true);
    });

    it('should handle versioned metrics correctly', async () => {
      mockProvider.exists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const pairs = [
        { metricId: 'metric-1', reportId: 'report-1', version: 1 },
        { metricId: 'metric-2', reportId: 'report-2', version: 2 },
        { metricId: 'metric-3', reportId: 'report-3', version: undefined },
      ];

      const results = await batchCheckCacheExists('org-123', pairs);

      expect(results.get('metric-1-report-1-v1')).toBe(true);
      expect(results.get('metric-2-report-2-v2')).toBe(false);
      expect(results.get('metric-3-report-3')).toBe(true);
      expect(mockProvider.exists).toHaveBeenCalledTimes(3);
    });
  });

  describe('version-aware caching', () => {
    it('should check legacy cache when version is provided but not found', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      mockProvider.download
        .mockResolvedValueOnce({
          success: false, // versioned key download fails
        })
        .mockResolvedValueOnce({
          success: true, // legacy key download succeeds
          data: Buffer.from(JSON.stringify({ metricId: 'metric-123', data: [] })),
          contentType: 'application/json',
          size: 100,
        });

      const result = await getCachedMetricData('org-123', 'metric-123', 'report-456', 2);

      expect(result).toBeTruthy();
      expect(result?.metricId).toBe('metric-123');
      expect(mockProvider.download).toHaveBeenCalledTimes(2);
      expect(mockProvider.download).toHaveBeenNthCalledWith(
        1,
        'static-report-assets/org-123/metric-123-report-456-v2.json'
      );
      expect(mockProvider.download).toHaveBeenNthCalledWith(
        2,
        'static-report-assets/org-123/metric-123-report-456.json'
      );

      consoleInfoSpy.mockRestore();
    });

    it('should write cache with version metadata', async () => {
      mockProvider.upload.mockResolvedValue({
        success: true,
        key: 'test-key',
        size: 100,
      });

      const dateSpy = vi
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2024-01-15T12:00:00.000Z');

      await setCachedMetricData(
        'org-123',
        'metric-456',
        'report-789',
        { metricId: 'metric-456', data: [] },
        3
      );

      expect(mockProvider.upload).toHaveBeenCalledWith(
        'static-report-assets/org-123/metric-456-report-789-v3.json',
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            'metric-version': '3',
          }),
        })
      );

      dateSpy.mockRestore();
    });
  });
});
