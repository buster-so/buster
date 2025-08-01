export const PREFETCH_STALE_TIME = 1000 * 10; // 10 seconds
export const ERROR_RETRY_DELAY = 1 * 1000; // 1 second delay after error
export const GC_TIME = 1000 * 60 * 60 * 24 * 3; // 24 hours - matches persistence duration
export const USER_CANCELLED_ERROR = new Error('User cancelled');
