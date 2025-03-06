import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { BusterChat } from '@/api/asset_interfaces';
import { useChatAssosciations } from './useChatAssosciations';
import { useChatSelectors } from './useChatSelectors';
import { useChatUpdate } from './useChatUpdate';

export const useBusterChat = () => {
  const chatAssociations = useChatAssosciations();

  const chatSelectors = useChatSelectors();

  const chatUpdate = useChatUpdate();

  return {
    ...chatAssociations,
    ...chatSelectors,
    ...chatUpdate
  };
};

const BusterChat = createContext<ReturnType<typeof useBusterChat>>(
  {} as ReturnType<typeof useBusterChat>
);

export const ChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterChat();

  return <BusterChat.Provider value={value}>{children}</BusterChat.Provider>;
};

export const useBusterChatContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterChat>) => T
) => useContextSelector(BusterChat, selector);
