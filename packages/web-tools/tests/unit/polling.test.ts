import { describe, expect, it, vi } from 'vitest';
import { CompanyResearchError } from '../../src/deep-research/types.js';
import { pollJobStatus } from '../../src/utils/polling.js';

describe('pollJobStatus', () => {
  it('should return immediately when job is completed', async () => {
    const mockStatus = { status: 'completed', data: 'test-data' };
    const statusChecker = vi.fn().mockResolvedValue(mockStatus);
    const isCompleted = vi.fn().mockReturnValue(true);
    const isFailed = vi.fn().mockReturnValue(false);
    const getErrorMessage = vi.fn();

    const result = await pollJobStatus(
      'test-job-id',
      statusChecker,
      isCompleted,
      isFailed,
      getErrorMessage,
      {
        interval: 1000,
        maxWaitTime: 5000,
      }
    );

    expect(result).toEqual(mockStatus);
    expect(statusChecker).toHaveBeenCalledTimes(1);
    expect(statusChecker).toHaveBeenCalledWith('test-job-id');
    expect(isCompleted).toHaveBeenCalledWith(mockStatus);
    expect(isFailed).not.toHaveBeenCalled();
  });

  it('should throw error when job fails', async () => {
    const mockStatus = { status: 'failed', error: 'Job failed' };
    const statusChecker = vi.fn().mockResolvedValue(mockStatus);
    const isCompleted = vi.fn().mockReturnValue(false);
    const isFailed = vi.fn().mockReturnValue(true);
    const getErrorMessage = vi.fn().mockReturnValue('Job failed');

    await expect(
      pollJobStatus('test-job-id', statusChecker, isCompleted, isFailed, getErrorMessage, {
        interval: 100,
        maxWaitTime: 1000,
      })
    ).rejects.toThrow(CompanyResearchError);

    expect(statusChecker).toHaveBeenCalledTimes(1);
    expect(isFailed).toHaveBeenCalledWith(mockStatus);
    expect(getErrorMessage).toHaveBeenCalledWith(mockStatus);
  });

  it('should timeout when maxWaitTime is exceeded', async () => {
    const mockStatus = { status: 'running' };
    const statusChecker = vi.fn().mockResolvedValue(mockStatus);
    const isCompleted = vi.fn().mockReturnValue(false);
    const isFailed = vi.fn().mockReturnValue(false);
    const getErrorMessage = vi.fn();

    await expect(
      pollJobStatus('test-job-id', statusChecker, isCompleted, isFailed, getErrorMessage, {
        interval: 100,
        maxWaitTime: 300, // Very short timeout
      })
    ).rejects.toThrow(CompanyResearchError);

    // Should have been called multiple times before timeout
    expect(statusChecker).toHaveBeenCalledWith('test-job-id');
  });

  it('should handle statusChecker errors', async () => {
    const statusChecker = vi.fn().mockRejectedValue(new Error('Network error'));
    const isCompleted = vi.fn();
    const isFailed = vi.fn();
    const getErrorMessage = vi.fn();

    await expect(
      pollJobStatus('test-job-id', statusChecker, isCompleted, isFailed, getErrorMessage, {
        interval: 100,
        maxWaitTime: 1000,
      })
    ).rejects.toThrow(CompanyResearchError);

    expect(statusChecker).toHaveBeenCalledTimes(1);
  });
});
