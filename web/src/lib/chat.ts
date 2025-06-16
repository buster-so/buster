import last from 'lodash/last';
import omit from 'lodash/omit';
import { create } from 'mutative';
import type {
  BusterChat,
  BusterChatMessage,
  IBusterChat,
  IBusterChatMessage
} from '@/api/asset_interfaces/chat';

const chatUpgrader = (chat: BusterChat, { isNewChat }: { isNewChat: boolean }): IBusterChat => {
  return {
    ...omit(chat, 'messages'),
    isNewChat
  };
};

const chatMessageUpgrader = (
  messageIds: string[],
  message: Record<string, BusterChatMessage>,
  streamingMessageId?: string
): Record<string, IBusterChatMessage> => {
  return messageIds.reduce(
    (acc, messageId) => {
      acc[messageId] = create(message[messageId] as IBusterChatMessage, (draft) => {
        draft.is_completed = !streamingMessageId || streamingMessageId !== messageId;
        return draft;
      });
      return acc;
    },
    {} as Record<string, IBusterChatMessage>
  );
};

export const updateChatToIChat = (
  chat: BusterChat,
  isNewChat: boolean
): { iChat: IBusterChat; iChatMessages: Record<string, IBusterChatMessage> } => {
  const iChat = chatUpgrader(chat, { isNewChat });
  const iChatMessages = chatMessageUpgrader(
    chat.message_ids,
    chat.messages,
    isNewChat ? last(chat.message_ids) : undefined
  );
  return {
    iChat,
    iChatMessages
  };
};
