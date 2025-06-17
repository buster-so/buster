/**
 * Circuit breaker pattern for AI agent retries
 * Temporarily stops retrying if failure rate is too high
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeoutMs = 60000, // 1 minute
    private readonly successThreshold = 2
  ) {}

  /**
   * Check if we should allow the operation to proceed
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (now - this.lastFailureTime >= this.recoveryTimeoutMs) {
          this.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;

    if (this.state === 'half-open' && this.successCount >= this.successThreshold) {
      this.state = 'closed';
      this.failureCount = 0;
      this.successCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Get current state info
   */
  getState(): {
    state: string;
    failureCount: number;
    successCount: number;
    canExecute: boolean;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      canExecute: this.canExecute(),
    };
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// Global circuit breaker instance for agent streams
export const agentStreamCircuitBreaker = new CircuitBreaker();
