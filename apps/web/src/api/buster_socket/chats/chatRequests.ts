import type { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Request type for creating a new chat session or continuing an existing one.
 * @interface ChatCreateNewChat
 * @extends BusterSocketRequestBase
 */
export type ChatCreateNewChat = BusterSocketRequestBase<
  '/chats/post',
  {
    /** The ID of the dataset to associate with the chat. Null if no dataset is associated */
    dataset_id?: string | null;
    /** The initial message or prompt to start the chat conversation */
    prompt: string;
    /** Optional ID of an existing chat for follow-up messages. Null for new chats */
    chat_id?: string | null;
    /** Optional ID of a clicked suggestion. If provided, returns that specific chat */
    suggestion_id?: string | null;
    /** Optional ID of a message to replace in an existing chat */
    message_id?: string;
    /** Optional ID of a metric to initialize the chat from */
    metric_id?: string;
    /** Optional ID of a dashboard to initialize the chat from */
    dashboard_id?: string;
  }
>;

/**
 * Request type for stopping an active chat or message generation.
 * @interface ChatStopChat
 * @extends BusterSocketRequestBase
 */
export type ChatStopChat = BusterSocketRequestBase<
  '/chats/stop',
  {
    /** The unique identifier of the chat to stop */
    id: string;
    /** The ID of the specific message to stop generating */
    message_id: string;
  }
>;

/**
 * Union type of all possible chat-related request types.
 */
export type ChatEmits = ChatCreateNewChat | ChatStopChat;
