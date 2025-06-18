interface RateLimiterOptions {
  maxConcurrent: number;
  maxPerSecond?: number;
  maxPerMinute?: number;
  queueTimeout?: number;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  enqueueTime: number;
}

interface RateLimiterStats {
  activeRequests: number;
  queuedRequests: number;
  requestsInLastSecond: number;
  requestsInLastMinute: number;
  oldestQueuedRequest: number;
}

/**
 * Rate limiter for controlling concurrent database operations
 */
export class RateLimiter {
  private activeCount = 0;
  // biome-ignore lint/suspicious/noExplicitAny: Generic queue needs to store different request types
  private queue: QueuedRequest<any>[] = [];
  private requestTimes: number[] = [];
  private options: Required<RateLimiterOptions>;

  constructor(options: RateLimiterOptions) {
    this.options = {
      maxConcurrent: options.maxConcurrent,
      maxPerSecond: options.maxPerSecond || Number.POSITIVE_INFINITY,
      maxPerMinute: options.maxPerMinute || Number.POSITIVE_INFINITY,
      queueTimeout: options.queueTimeout || 60000, // Default 60s timeout
    };
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute: fn,
        resolve,
        reject,
        enqueueTime: Date.now(),
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Process queued requests while respecting rate limits
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more requests
    if (this.activeCount >= this.options.maxConcurrent) {
      return;
    }

    // Check rate limits
    if (!this.canProcessRequest()) {
      // Schedule retry after a short delay
      setTimeout(() => this.processQueue(), 100);
      return;
    }

    // Get next request from queue
    const request = this.queue.shift();
    if (!request) {
      return;
    }

    // Check if request has timed out
    const waitTime = Date.now() - request.enqueueTime;
    if (waitTime > this.options.queueTimeout) {
      request.reject(new Error(`Request timed out after ${waitTime}ms in queue`));
      // Continue processing queue
      this.processQueue();
      return;
    }

    // Execute the request
    this.activeCount++;
    this.recordRequest();

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeCount--;
      // Process next request
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Check if we can process a request based on rate limits
   */
  private canProcessRequest(): boolean {
    const now = Date.now();

    // Clean up old request times
    this.requestTimes = this.requestTimes.filter((time) => now - time < 60000);

    // Check per-second limit
    const oneSecondAgo = now - 1000;
    const requestsInLastSecond = this.requestTimes.filter((time) => time > oneSecondAgo).length;
    if (requestsInLastSecond >= this.options.maxPerSecond) {
      return false;
    }

    // Check per-minute limit
    const oneMinuteAgo = now - 60000;
    const requestsInLastMinute = this.requestTimes.filter((time) => time > oneMinuteAgo).length;
    if (requestsInLastMinute >= this.options.maxPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Record a request time for rate limiting
   */
  private recordRequest(): void {
    this.requestTimes.push(Date.now());
  }

  /**
   * Get current queue statistics
   */
  getStats(): RateLimiterStats {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const oneMinuteAgo = now - 60000;

    return {
      activeRequests: this.activeCount,
      queuedRequests: this.queue.length,
      requestsInLastSecond: this.requestTimes.filter((time) => time > oneSecondAgo).length,
      requestsInLastMinute: this.requestTimes.filter((time) => time > oneMinuteAgo).length,
      oldestQueuedRequest:
        this.queue.length > 0 && this.queue[0] ? now - this.queue[0].enqueueTime : 0,
    };
  }

  /**
   * Clear the queue (reject all pending requests)
   */
  clearQueue(): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request.reject(new Error('Queue cleared'));
      }
    }
  }
}

// Global rate limiters for different operation types
const rateLimiters = new Map<string, RateLimiter>();

/**
 * Get or create a rate limiter for a specific operation type
 */
export function getRateLimiter(
  type: string,
  options: RateLimiterOptions = {
    maxConcurrent: 10,
    maxPerSecond: 25,
    maxPerMinute: 300,
  }
): RateLimiter {
  if (!rateLimiters.has(type)) {
    rateLimiters.set(type, new RateLimiter(options));
  }
  const limiter = rateLimiters.get(type);
  if (!limiter) {
    throw new Error(`Failed to create rate limiter for type: ${type}`);
  }
  return limiter;
}

/**
 * Execute a database operation with rate limiting
 */
export async function withRateLimit<T>(
  type: string,
  fn: () => Promise<T>,
  options?: RateLimiterOptions
): Promise<T> {
  const limiter = getRateLimiter(type, options);
  return limiter.execute(fn);
}

/**
 * Batch execute operations with rate limiting
 */
export async function batchWithRateLimit<T>(
  type: string,
  operations: (() => Promise<T>)[],
  options?: RateLimiterOptions
): Promise<T[]> {
  const limiter = getRateLimiter(type, options);
  return Promise.all(operations.map((op) => limiter.execute(op)));
}

/**
 * Get statistics for all rate limiters
 */
export function getAllRateLimiterStats(): Record<string, RateLimiterStats> {
  const stats: Record<string, RateLimiterStats> = {};
  for (const [type, limiter] of rateLimiters.entries()) {
    stats[type] = limiter.getStats();
  }
  return stats;
}
