/**
 * Cleanup helper to clear tool state after execution
 * Helps prevent memory leaks during long-running streaming sessions
 */
export function cleanupState(state: Record<string, unknown>): void {
  // Clear all properties except toolCallId (might be needed for logging)
  Object.keys(state).forEach((key) => {
    if (key !== 'toolCallId' && key !== 'isFinalizing') {
      state[key] = undefined;
    }
  });
}
