'use client';

import React, { useRef } from 'react';
import { useMount } from '@/hooks';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/lib/utils';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { ChatInput } from './ChatInput';
import { ChatMessageBlock } from './ChatMessageBlock';
import { ChatScrollToBottom } from './ChatScrollToBottom';

const autoClass = 'mx-auto max-w-[600px] w-full';

export const ChatContent: React.FC = React.memo(() => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const chatMessageIds = useChatIndividualContextSelector((state) => state.chatMessageIds);
  const containerRef = useRef<HTMLElement | null>(null);

  const { isAutoScrollEnabled, scrollToBottom, enableAutoScroll } = useAutoScroll(containerRef, {
    observeSubTree: true,
    enabled: false
  });

  useMount(() => {
    const container = document.querySelector(
      '.chat-container-content .scroll-area-viewport'
    ) as HTMLElement;
    if (!container) return;
    containerRef.current = container;
    enableAutoScroll();
  });

  return (
    <>
      <div className="mb-48 flex h-full w-full flex-col">
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
      </div>

      <ChatInputWrapper>
        <ChatScrollToBottom
          isAutoScrollEnabled={isAutoScrollEnabled}
          scrollToBottom={scrollToBottom}
        />
      </ChatInputWrapper>
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
        <ChatInput />
        {children}
      </div>
    </div>
  );
};

ChatInputWrapper.displayName = 'ChatInputWrapper';
