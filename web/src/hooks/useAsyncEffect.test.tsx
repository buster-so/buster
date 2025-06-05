import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAsyncEffect } from './useAsyncEffect';

describe('useAsyncEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should execute the async effect', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAsyncEffect(mockEffect));

    expect(mockEffect).toHaveBeenCalled();
  });

  it('should handle cleanup function when provided', async () => {
    const mockCleanup = vi.fn();
    const mockEffect = vi.fn().mockResolvedValue(mockCleanup);

    const { unmount } = renderHook(() => useAsyncEffect(mockEffect));

    // Wait for the effect to complete
    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    expect(mockCleanup).toHaveBeenCalled();
  });

  it('should re-run effect when dependencies change', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);
    let dependency = 1;

    const { rerender } = renderHook(() => useAsyncEffect(mockEffect, [dependency]));

    expect(mockEffect).toHaveBeenCalledTimes(1);

    dependency = 2;
    rerender();

    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    const mockEffect = vi.fn().mockRejectedValue(error);

    renderHook(() => useAsyncEffect(mockEffect));

    await act(async () => {
      await Promise.resolve();
    });

    expect(console.error).toHaveBeenCalledWith('Error in async effect:', error);
  });

  it('should not call cleanup if no cleanup function was returned', async () => {
    const mockEffect = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useAsyncEffect(mockEffect));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();
    // No error should be thrown
  });
});
