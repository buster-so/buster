import { CompanyResearchError } from '../deep-research/types';

export interface PollingOptions {
  /** Initial polling interval in milliseconds */
  interval: number;
  /** Maximum time to wait before timeout in milliseconds */
  maxWaitTime: number;
  /** Maximum interval between polls in milliseconds */
  maxInterval?: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
}

export async function pollJobStatus<T>(
  jobId: string,
  statusChecker: (jobId: string) => Promise<T>,
  isCompleted: (status: T) => boolean,
  isFailed: (status: T) => boolean,
  getErrorMessage: (status: T) => string,
  options: PollingOptions
): Promise<T> {
  const {
    interval: initialInterval,
    maxWaitTime,
    maxInterval = 30000, // 30 seconds max
    backoffMultiplier = 1.2,
  } = options;

  const startTime = Date.now();
  let currentInterval = initialInterval;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const status = await statusChecker(jobId);

      // Check if job is completed
      if (isCompleted(status)) {
        return status;
      }

      // Check if job failed
      if (isFailed(status)) {
        throw new CompanyResearchError(
          `Deep research job failed: ${getErrorMessage(status)}`,
          'API_ERROR',
          String(getErrorMessage(status))
        );
      }

      // Wait before next poll
      await sleep(currentInterval);

      // Increase interval with backoff (but cap at maxInterval)
      currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
    } catch (error) {
      // If it's our custom error, re-throw it
      if (error instanceof CompanyResearchError) {
        throw error;
      }

      // For other errors, wrap them
      throw new CompanyResearchError(
        `Error polling job status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR',
        error instanceof Error ? error : String(error)
      );
    }
  }

  // Timeout reached
  throw new CompanyResearchError(
    `Job polling timed out after ${maxWaitTime}ms`,
    'TIMEOUT',
    `Job ID: ${jobId}, Max wait time: ${maxWaitTime}ms`
  );
}

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
