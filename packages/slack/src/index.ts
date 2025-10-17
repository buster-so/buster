// Types

export type { ISlackMessageTracking, MessageTrackingData } from './interfaces/message-tracking';
export { MessageTrackingDataSchema } from './interfaces/message-tracking';
// Interfaces
export type {
  ISlackOAuthStateStorage,
  ISlackTokenStorage,
  SlackOAuthStateData,
} from './interfaces/token-storage';
export { SlackOAuthStateDataSchema } from './interfaces/token-storage';
// Reactions
export { addReaction, getReactions, removeReaction } from './reactions';
// Services
export { SlackAuthService } from './services/auth';
export { SlackChannelService } from './services/channels';
export { SlackMessagingService } from './services/messaging';
export { type SlackUser, type SlackUserInfoResponse, SlackUserService } from './services/users';
export {
  getRawBody,
  handleUrlVerification,
  parseSlackWebhookPayload,
  verifySlackRequest,
} from './services/webhook-verification';
// Threads
export {
  formatThreadMessages,
  getMessage,
  getThreadMessages,
  getThreadReplyCount,
  type SlackMessage,
} from './threads';
export * from './types';
export * from './types/errors';
export * from './types/webhooks';
// Schemas for validation (useful with zValidator)
export {
  appMentionEventSchema,
  eventCallbackSchema,
  isAppMentionEvent,
  isEventCallback,
  isMessageImEvent,
  isUrlVerification,
  messageImEventSchema,
  slackEventEnvelopeSchema,
  slackRequestHeadersSchema,
  slackWebhookPayloadSchema,
  urlVerificationSchema,
} from './types/webhooks';
export { decodeHtmlEntities, decodeSlackMessageText } from './utils/html-entities';
export { convertMarkdownToSlack } from './utils/markdown-to-slack';
export * from './utils/message-formatter';
export * from './utils/oauth-helpers';
// Utils
export * from './utils/validation-helpers';

// Version
export const VERSION = '1.0.0';
