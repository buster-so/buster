import type { RustApiError } from '../../buster_rest/errors';
import type { BusterChat } from '../../asset_interfaces/chat';
import type {
  ChatEvent_GeneratingReasoningMessage,
  ChatEvent_GeneratingResponseMessage,
  ChatEvent_GeneratingTitle
} from './eventInterfaces';

export enum ChatsResponses {
  '/chats/get:getChat' = '/chats/get:getChat',
  '/chats/post:initializeChat' = '/chats/post:initializeChat',
  '/chats/post:generatingTitle' = '/chats/post:generatingTitle',
  '/chats/post:generatingResponseMessage' = '/chats/post:generatingResponseMessage',
  '/chats/post:generatingReasoningMessage' = '/chats/post:generatingReasoningMessage',
  '/chats/post:complete' = '/chats/post:complete'
}

/**
 * Response type for getting a single chat's details.
 * This response is triggered when requesting a specific chat's information.
 */
export type Chat_getChat = {
  /** The route identifier for getting a single chat */
  route: '/chats/get:getChat';
  /** Callback function that receives the chat data */
  callback: (chat: BusterChat) => void;
  /** Optional error handler for when the chat request fails */
  onError?: (error: RustApiError) => void;
};

/***** CHAT PROGRESS EVENTS START ******/

export type ChatPost_initializeChat = {
  route: '/chats/post:initializeChat';
  callback: (d: BusterChat) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_generatingTitle = {
  route: '/chats/post:generatingTitle';
  callback: (d: ChatEvent_GeneratingTitle) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_generatingResponseMessage = {
  route: '/chats/post:generatingResponseMessage';
  callback: (d: ChatEvent_GeneratingResponseMessage) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_generatingReasoningMessage = {
  route: '/chats/post:generatingReasoningMessage';
  callback: (d: ChatEvent_GeneratingReasoningMessage) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_complete = {
  route: '/chats/post:complete';
  callback: (d: BusterChat) => void;
  onError?: (d: unknown | RustApiError) => void;
};

/***** CHAT PROGRESS EVENTS END ******/

export type ChatResponseTypes =
  | Chat_getChat
  | ChatPost_initializeChat
  | ChatPost_generatingTitle
  | ChatPost_generatingResponseMessage
  | ChatPost_generatingReasoningMessage
  | ChatPost_complete;
