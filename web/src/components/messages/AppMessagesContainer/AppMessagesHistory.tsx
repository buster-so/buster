import React, { useEffect, useMemo } from 'react';
import { createStyles } from 'antd-style';
import type { AppMessageContainerMessage } from './AppMessagesContainer';
import { useScroll } from 'ahooks';
import last from 'lodash/last';
import { AppHistoryMessage } from './AppHistoryMessage';
import { useSmoothScroller } from '@/hooks';

const useStyles = createStyles(({ css }) => ({
  container: css`
    .sidebar-history-message {
      .buster-datasets,
      .buster-suggestion {
        display: none;
      }

      :last-child {
        .buster-datasets,
        .buster-suggestion {
          display: inherit;
        }
      }
    }
  `
}));

export const AppMessagesHistory: React.FC<{
  isReadOnly: boolean;
  isStreaming: boolean;
  messages: AppMessageContainerMessage[];
  openMessageId: string | null;
  editMessageId: string | null;
  onSetEditMessageId: (id: string | null) => void;
  onSetOpenMessageId: (id: string) => void;
  onEditMessage: (id: string, messageText: string) => Promise<void>;
}> = ({
  isReadOnly,
  openMessageId,
  messages,
  isStreaming,
  onSetEditMessageId,
  onEditMessage,
  onSetOpenMessageId,
  editMessageId
}) => {
  const { cx, styles } = useStyles();
  const lastMessage = last(messages);

  const smoothScrollDependencies = useMemo(() => {
    return {
      enabled: isStreaming && !!lastMessage?.responseMessage?.text,
      dependencies: [isStreaming, lastMessage?.responseMessage?.text]
    };
  }, [isStreaming, lastMessage?.responseMessage?.text]);

  const { scrollContainerRef, instantScrollLastItemIntoView, isStickyToBottom } =
    useSmoothScroller(smoothScrollDependencies);

  const s = useScroll(scrollContainerRef);
  const showTopScroll = (s?.top || 0) > 0;

  const memoizedTopScrollStyle = useMemo(() => {
    return {
      boxShadow: `rgb(0 0 0 / 20%) 0px 1px 7px 1px`,
      opacity: showTopScroll ? 1 : 0,
      zIndex: 1
    };
  }, [showTopScroll]);

  useEffect(() => {
    if (!messages?.length) return;
    const lastItemId = `message_${last(messages)?.id}`;
    instantScrollLastItemIntoView(lastItemId);
  }, [messages?.length]);

  return (
    <>
      <div
        className="z-1 absolute left-0 right-0 top-0 w-full transition"
        style={memoizedTopScrollStyle}
      />
      <div
        className={cx(
          styles.container,
          'flex w-full flex-col space-y-0 overflow-y-auto scroll-smooth px-0 py-1 pb-[100px] pt-4',
          isStickyToBottom && 'overflow-x-hidden',
          'sidebar-history'
        )}
        ref={scrollContainerRef}>
        {messages.map((message, index) => (
          <AppHistoryMessage
            key={message.id}
            message={message}
            isReadOnly={isReadOnly}
            editMessageId={editMessageId}
            onSetOpenMessageId={onSetOpenMessageId}
            openMessageId={openMessageId}
            thoughts={message.thoughts}
            onSetEditMessageId={onSetEditMessageId}
            onEditMessage={onEditMessage}
            isStreaming={isStreaming && index === messages.length - 1}
          />
        ))}
      </div>
    </>
  );
};
