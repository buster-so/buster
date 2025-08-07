export const PREFETCH_STALE_TIME = 1000 * 10; // 10 seconds
export const ERROR_RETRY_DELAY = 1 * 1000; // 1 second delay after error
// Reduce browser GC time to 30 minutes to lower memory residency
export const GC_TIME = typeof window === 'undefined' ? 1000 * 60 * 60 * 24 * 3 : 1000 * 60 * 30;
export const USER_CANCELLED_ERROR = new Error('User cancelled');
