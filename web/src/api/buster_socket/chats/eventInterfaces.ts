import type {
  BusterChatMessageReasoning,
  BusterChatMessageResponse
} from '@/api/asset_interfaces/chat';
import type { EventBase } from '../base_interfaces';

export type ChatEvent_GeneratingTitle = {
  /** The complete generated title when available */
  title?: string;
  /** A partial chunk of the title during the generation process */
  title_chunk?: string;
  /** The ID of the chat that the title belongs to */
  chat_id: string;
} & EventBase;

export type ChatEvent_GeneratingResponseMessage = {
  // We will append each incoming message to the response_messages array
  // If the message id is already found in the array, we will update the message with the new data
  // This will happen when we need to "hide" a message
  /** The chat message response containing the generated content */
  response_message: BusterChatMessageResponse;
  /** The ID of the chat that the response message belongs to */
  chat_id: string;
  /** The ID of the message that the response message belongs to */
  message_id: string;
} & EventBase;
