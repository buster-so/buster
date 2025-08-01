export interface CancellationController {
  cancel(): Promise<void>;
  isCancelled(): boolean;
  onCancellation(callback: () => Promise<void>): void;
}

export interface CancellableQuery<T> {
  execute(): Promise<T>;
  cancel(): Promise<void>;
  onTimeout(timeoutMs: number): Promise<T>;
}
