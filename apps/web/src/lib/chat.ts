import type { BusterChat, BusterChatMessage, IBusterChat } from '@/api/asset_interfaces/chat';

export const updateChatToIChat = (
  chat: BusterChat
): { iChat: IBusterChat; iChatMessages: Record<string, BusterChatMessage> } => {
  const { messages, ...chatWithoutMessages } = chat;
  const iChat = chatWithoutMessages;
  const iChatMessages = messages;
  return {
    iChat,
    iChatMessages
  };
};
