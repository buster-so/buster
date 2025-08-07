import { describe, expect, it, vi } from 'vitest';
import { BaseCancellationController } from './controller.js';

describe('BaseCancellationController', () => {
  it('should start as not cancelled', () => {
    const controller = new BaseCancellationController();
    expect(controller.isCancelled()).toBe(false);
  });

  it('should become cancelled after cancel is called', async () => {
    const controller = new BaseCancellationController();
    await controller.cancel();
    expect(controller.isCancelled()).toBe(true);
  });

  it('should call cancellation callbacks when cancelled', async () => {
    const controller = new BaseCancellationController();
    const callback = vi.fn().mockResolvedValue(undefined);

    controller.onCancellation(callback);
    await controller.cancel();

    expect(callback).toHaveBeenCalled();
  });

  it('should call callback immediately if already cancelled', async () => {
    const controller = new BaseCancellationController();
    await controller.cancel();

    const callback = vi.fn().mockResolvedValue(undefined);
    controller.onCancellation(callback);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callback).toHaveBeenCalled();
  });

  it('should handle callback errors gracefully', async () => {
    const controller = new BaseCancellationController();
    const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    controller.onCancellation(errorCallback);

    await controller.cancel();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(errorCallback).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error in cancellation callback:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
