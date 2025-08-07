import type { CancellationController } from './types.js';

export class BaseCancellationController implements CancellationController {
  private cancelled = false;
  private cancellationCallbacks: (() => Promise<void>)[] = [];

  async cancel(): Promise<void> {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;

    const results = await Promise.allSettled(
      this.cancellationCallbacks.map((callback) => callback())
    );

    results.forEach((result, _index) => {
      if (result.status === 'rejected') {
        console.error('Error in cancellation callback:', result.reason);
      }
    });
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  onCancellation(callback: () => Promise<void>): void {
    if (this.cancelled) {
      callback().catch((err) => {
        console.error('Error in cancellation callback:', err);
      });
      return;
    }

    this.cancellationCallbacks.push(callback);
  }
}
