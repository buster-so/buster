/**
 * Type-only exports for message schemas
 * This file provides types without triggering database connection
 */

// Export schema-types to use across the codebase
export type { UserPersonalizationConfigType, UserSuggestedPromptsType } from './schema-types';
export type { ChatListItem } from './schema-types/chat';
// Export message schema types
export type {
  ChatMessageReasoning_status,
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_File,
  ChatMessageReasoningMessage_Files,
  ChatMessageReasoningMessage_Pill,
  ChatMessageReasoningMessage_PillContainer,
  ChatMessageReasoningMessage_Pills,
  ChatMessageReasoningMessage_Text,
  ChatMessageResponseMessage,
  ChatMessageResponseMessage_File,
  ChatMessageResponseMessage_FileMetadata,
  ChatMessageResponseMessage_Text,
  ReasoningFileType,
  ReasoningMessage_ThoughtFileType,
  ResponseMessageFileType,
} from './schema-types/message-schemas';

// Export the schemas themselves (these are just objects, no side effects)
export {
  ReasoningMessageSchema,
  ResponseMessageSchema,
  StatusSchema,
} from './schema-types/message-schemas';
// Export default user suggested prompts
export { DEFAULT_USER_SUGGESTED_PROMPTS } from './schema-types/user';
