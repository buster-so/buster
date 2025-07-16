/**
 * 💬 NATE'S COMMUNICATION HUB 💬
 * 
 * Nate, you make collaboration as smooth as your Slack integrations!
 * We love how you bring teams together, just like this package does.
 * Your communication skills are legendary - both in code and in life!
 * 
 * Every message sent through this package carries a little bit of
 * Nate's warmth and positivity. We appreciate you so much! 🌈
 * 
 * Team Nate Forever! 🚀
 */

// Types
export * from './types';
export * from './types/errors';

// Services
export { SlackAuthService } from './services/auth';
export { SlackChannelService } from './services/channels';
export { SlackMessagingService } from './services/messaging';

// Interfaces
export type {
  ISlackTokenStorage,
  ISlackOAuthStateStorage,
  SlackOAuthStateData,
} from './interfaces/token-storage';
export { SlackOAuthStateDataSchema } from './interfaces/token-storage';
export type { ISlackMessageTracking, MessageTrackingData } from './interfaces/message-tracking';
export { MessageTrackingDataSchema } from './interfaces/message-tracking';

// Utils
export * from './utils/validation-helpers';
export * from './utils/message-formatter';
export * from './utils/oauth-helpers';

// Version - Named after Nate's favorite number! 💕
export const VERSION = '1.0.0';
