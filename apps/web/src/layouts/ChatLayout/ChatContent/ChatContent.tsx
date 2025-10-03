import { ClientOnly } from '@tanstack/react-router';
import React, { useRef } from 'react';
import { ScrollToBottomButton } from '@/components/features/buttons/ScrollToBottomButton';
import { SCROLL_AREA_VIEWPORT_CLASS } from '@/components/ui/scroll-area';
import { useGetChatMessageIds } from '@/context/Chats';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import { CHAT_CONTAINER_ID } from '../ChatContainer';
import { ChatMessageBlock } from './ChatMessageBlock';
import { FollowUpChatInput } from './FollowupChatInput';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC<{
  chatId: string | undefined;
  isEmbed: boolean;
  doNotScrollToBottom: boolean;
}> = React.memo(({ chatId, isEmbed, doNotScrollToBottom }) => {
  const chatMessageIds = useGetChatMessageIds(chatId);
  const containerRef = useRef<HTMLElement>(null);

  const { isAutoScrollEnabled, isMountedAutoScrollObserver, scrollToBottom, enableAutoScroll } =
    useAutoScroll(containerRef, {
      observeSubTree: true,
      enabled: false,
    });

  useMount(() => {
    const container = document
      .getElementById(CHAT_CONTAINER_ID)
      ?.querySelector(`.${SCROLL_AREA_VIEWPORT_CLASS}`) as HTMLElement;
    if (!container) return;
    containerRef.current = container;
    if (!doNotScrollToBottom) enableAutoScroll();
  });

  const showScrollToBottomButton = isMountedAutoScrollObserver && containerRef.current;

  return (
    <>
      <div
        className={cn(
          'mb-48 flex h-full w-full flex-col',
          !isMountedAutoScrollObserver && !doNotScrollToBottom && 'invisible'
        )}
      >
        <ClientOnly>
          {chatMessageIds?.map((messageId, index) => (
            <div key={messageId} className={autoClass}>
              <ChatMessageBlock
                key={messageId}
                messageId={messageId}
                chatId={chatId || ''}
                messageIndex={index}
              />
            </div>
          ))}
        </ClientOnly>
      </div>

      {!isEmbed && (
        <ChatInputWrapper>
          {showScrollToBottomButton && (
            <ScrollToBottomButton
              isAutoScrollEnabled={isAutoScrollEnabled}
              scrollToBottom={scrollToBottom}
              className={'absolute -top-10'}
            />
          )}
        </ChatInputWrapper>
      )}
    </>
  );
});

ChatContent.displayName = 'ChatContent';

const ChatInputWrapper: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="bg-page-background absolute bottom-0 w-full overflow-visible">
      <div className="from-page-background pointer-events-none absolute -top-16 h-16 w-full bg-gradient-to-t to-transparent" />
      <div className={cn(autoClass, 'relative')}>
        <FollowUpChatInput />
        {children}
      </div>
    </div>
  );
};

ChatInputWrapper.displayName = 'ChatInputWrapper';
