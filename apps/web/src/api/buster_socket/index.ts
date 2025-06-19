import type { ChatEmits, ChatResponseTypes, ChatsResponses } from './chats';

export type BusterSocketRequest = ChatEmits;

export type BusterSocketResponse = ChatResponseTypes;

export type BusterSocketResponseRoute = keyof typeof ChatsResponses;
