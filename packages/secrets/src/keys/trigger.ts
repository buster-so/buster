/**
 * Secret keys used by the @buster-app/trigger application
 */

export const TRIGGER_KEYS = {
  // Database
  DATABASE_URL: 'DATABASE_URL',

  // Trigger.dev
  TRIGGER_SECRET_KEY: 'TRIGGER_SECRET_KEY',

  // Evaluation & Monitoring
  BRAINTRUST_KEY: 'BRAINTRUST_KEY',
  ENVIRONMENT: 'ENVIRONMENT',

  // Application URLs
  BUSTER_URL: 'BUSTER_URL',

  // Alert Notifications
  BUSTER_ALERT_CHANNEL_TOKEN: 'BUSTER_ALERT_CHANNEL_TOKEN',
  BUSTER_ALERT_CHANNEL_ID: 'BUSTER_ALERT_CHANNEL_ID',
} as const;

export type TriggerKeys = (typeof TRIGGER_KEYS)[keyof typeof TRIGGER_KEYS];
