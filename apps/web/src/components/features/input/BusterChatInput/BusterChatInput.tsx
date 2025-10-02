import type React from 'react';
import { useListShortcuts } from '@/api/buster_rest/shortcuts/queryRequests';
import { useGetSuggestedPrompts } from '@/api/buster_rest/users';
import { useChat } from '@/context/Chats/useChat';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { BusterChatInputBase, type BusterChatInputProps } from './BusterChatInputBase';

export const BusterChatInput: React.FC<{
  initialValue?: string;
  autoSubmit?: boolean;
}> = ({ initialValue = '', autoSubmit }) => {
  const { data: suggestions, isFetched: isFetchedSuggestions } = useGetSuggestedPrompts();
  const { data: shortcuts, isFetched: isFetchedShortcuts } = useListShortcuts();
  const { onStartNewChat, onStopChat, isSubmittingChat } = useChat();
  const chatId = useGetChatId();

  const disabled = !isFetchedSuggestions || !isFetchedShortcuts || isSubmittingChat;

  const onStop = useMemoizedFn(() => {
    if (chatId) {
      onStopChat({ chatId });
    }
  });

  const onSubmit: BusterChatInputProps['onSubmit'] = useMemoizedFn(({ transformedValue, mode }) => {
    return onStartNewChat({ prompt: transformedValue, mode });
  });

  return (
    <BusterChatInputBase
      defaultValue={initialValue}
      suggestedPrompts={suggestions?.suggestedPrompts}
      shortcuts={shortcuts?.shortcuts}
      onStop={onStop}
      disabled={disabled}
      submitting={isSubmittingChat}
      onSubmit={onSubmit}
      autoSubmit={autoSubmit}
    />
  );
};
