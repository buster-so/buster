import type { MessageAnalysisMode } from '@buster/server-shared/chats';
import React, { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { InputTextAreaButton } from '@/components/ui/inputs/InputTextAreaButton';
import { Text } from '@/components/ui/typography';
import { useChatPermission, useIsStreamingMessage } from '@/context/Chats';
import { useFollowUpChatInputFlow } from '@/context/Chats/useFollowUpChatInputFlow';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { useIsChatMode } from '@/context/Chats/useMode';
import { cn } from '@/lib/classMerge';
import { canEdit } from '@/lib/share';
import { inputHasText } from '@/lib/text';
import { AIWarning } from './AIWarning';

export const FollowUpChatInput: React.FC = React.memo(() => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isStreamingMessage = useIsStreamingMessage();
  const hasChat = useIsChatMode();
  const chatId = useGetChatId();
  const permission = useChatPermission(chatId);
  const canEditChat = canEdit(permission);

  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<MessageAnalysisMode>('auto');

  const disableSubmit = useMemo(() => {
    return (!inputHasText(inputValue) && !isStreamingMessage) || !canEditChat;
  }, [inputValue, isStreamingMessage, canEditChat]);

  const { onSubmitPreflight, onStopChat } = useFollowUpChatInputFlow({
    disableSubmit,
    inputValue,
    setInputValue,
    loading: isStreamingMessage,
    textAreaRef,
    mode,
  });

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue(e.target.value);
  };

  useEffect(() => {
    if (hasChat) {
      requestAnimationFrame(() => {
        textAreaRef.current?.focus?.();
      });
    }
  }, [hasChat, textAreaRef]);

  return (
    <div
      className={cn(
        'z-10 mx-3 mt-0.5 mb-2 flex min-h-fit flex-col items-center space-y-1.5 overflow-visible'
      )}
    >
      {!canEditChat ? (
        <div className="w-full p-4 bg-muted/50 rounded border">
          <Text variant="secondary" size="sm" className="text-center">
            This chat is view-only. You don't have permission to send messages.
          </Text>
        </div>
      ) : (
        <>
          <InputTextAreaButton
            placeholder="Ask Buster a question..."
            minRows={2}
            maxRows={16}
            onSubmit={onSubmitPreflight}
            onChange={onChange}
            onStop={onStopChat}
            loading={isStreamingMessage}
            value={inputValue}
            disabled={!hasChat || !canEditChat}
            disabledSubmit={disableSubmit}
            autoFocus
            ref={textAreaRef}
          />
          <AIWarning />
        </>
      )}
    </div>
  );
});

FollowUpChatInput.displayName = 'FollowUpChatInput';
