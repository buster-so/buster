'use client';

import { useUpdateChat } from '@/api/buster_rest/chats';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

export const CHAT_HEADER_TITLE_ID = 'chat-header-title';

export const ChatHeaderTitle: React.FC<{
  chatTitle: string;
  chatId: string;
  isCompletedStream: boolean;
}> = React.memo(({ chatTitle, chatId, isCompletedStream }) => {
  const { mutateAsync: updateChat } = useUpdateChat();

  if (!chatTitle) return <div />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        {...(isCompletedStream ? animation : {})}
        key={chatTitle}
        className="flex w-full items-center overflow-hidden">
        <EditableTitle
          className="w-full"
          placeholder="New chat"
          level={5}
          id={CHAT_HEADER_TITLE_ID}
          onChange={(value) =>
            value && value !== chatTitle && updateChat({ id: chatId, title: value })
          }>
          {chatTitle}
        </EditableTitle>
      </motion.div>
    </AnimatePresence>
  );
});

ChatHeaderTitle.displayName = 'ChatHeaderTitle';
