/**
 * Constants for public chat API
 */

// Default messages
export const DEFAULT_MESSAGES = {
  PROCESSING_START: "I've started working on your request. I'll notify you when it's finished.",
  PROCESSING_COMPLETE: "I've finished working on your request!",
  PROCESSING_COMPLETE_GENERIC: "I've completed your request!",
  STILL_PROCESSING: 'Still processing your request...',
  ERROR_GENERIC: 'An unexpected error occurred while processing your request',
  ERROR_INTERNAL: 'Internal server error',
  ERROR_JOB_FAILED: 'The processing job failed. Please try again.',
  ERROR_TIMEOUT: 'Request processing timed out after 30 minutes.',
} as const;

// Polling configuration defaults
export const POLLING_CONFIG = {
  INITIAL_DELAY_MS: 2000, // Start checking after 2 seconds
  INTERVAL_MS: 5000, // Check every 5 seconds
  MAX_DURATION_MS: 30 * 60 * 1000, // 30 minutes max
  BACKOFF_MULTIPLIER: 1.2, // Gradually increase interval
  MAX_INTERVAL_MS: 15000, // Max 15 seconds between checks
  STATUS_UPDATE_INTERVAL_MS: 5000, // Send status update every 5 seconds
} as const;

// SSE configuration
export const SSE_CONFIG = {
  HEARTBEAT_INTERVAL_MS: 30000, // Send heartbeat every 30 seconds
} as const;

// URL configuration
export const URL_CONFIG = {
  DEFAULT_BASE_URL: 'https://platform.buster.so',
} as const;
