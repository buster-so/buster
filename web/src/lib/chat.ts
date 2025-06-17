import type {
  BusterChat,
  BusterChatMessage,
  IBusterChat,
  IBusterChatMessage
} from '@/api/asset_interfaces/chat';

export const updateChatToIChat = (
  chat: BusterChat
): { iChat: IBusterChat; iChatMessages: Record<string, IBusterChatMessage> } => {
  const { messages, ...chatWithoutMessages } = chat;
  const iChat = chatWithoutMessages;
  const iChatMessages = messages;
  return {
    iChat,
    iChatMessages
  };
};
