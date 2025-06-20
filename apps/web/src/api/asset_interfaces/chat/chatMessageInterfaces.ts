// These types are an artifact of us moving to the server types.
// They are used to convert the server types to the client types.

import type {
  ChatMessage,
  ChatUserMessage,
  ChatMessageResponseMessage,
  ChatMessageResponseMessage_Text,
  ChatMessageResponseMessage_File,
  ChatMessageReasoning_status,
  ChatMessageResponseMessage_FileMetadata,
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_Text,
  ChatMessageReasoningMessage_Pills,
  ChatMessageReasoningMessage_PillContainer,
  ChatMessageReasoningMessage_File,
  ChatMessageReasoningMessage_Pill,
  ChatMessageReasoningMessage_Files
} from '@buster/server-shared/chats';

export type BusterChatMessage = ChatMessage;

export type BusterChatMessageRequest = ChatUserMessage;

export type BusterChatMessageResponse = ChatMessageResponseMessage;

export type BusterChatResponseMessage_text = ChatMessageResponseMessage_Text;

export type BusterChatMessageReasoning_status = ChatMessageReasoning_status;

export type BusterChatResponseMessage_fileMetadata = ChatMessageResponseMessage_FileMetadata;

export type BusterChatResponseMessage_file = ChatMessageResponseMessage_File;

export type BusterChatMessageReasoning = ChatMessageReasoningMessage;

export type BusterChatMessageReasoning_pill = ChatMessageReasoningMessage_Pill;

export type BusterChatMessageReasoning_pillContainer = ChatMessageReasoningMessage_PillContainer;

export type BusterChatMessageReasoning_pills = ChatMessageReasoningMessage_Pills;

export type BusterChatMessageReasoning_text = ChatMessageReasoningMessage_Text;

export type BusterChatMessageReasoning_file = ChatMessageReasoningMessage_File;

export type BusterChatMessageReasoning_files = ChatMessageReasoningMessage_Files;
