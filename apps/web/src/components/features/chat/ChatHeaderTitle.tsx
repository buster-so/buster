import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useUpdateChat } from '@/api/buster_rest/chats';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

export const CHAT_HEADER_TITLE_ID = 'chat-header-title';

export const ChatHeaderTitle: React.FC<{
  chatTitle: string;
  chatId: string;
  isStreamingMessage: boolean;
}> = ({ chatTitle, chatId, isStreamingMessage }) => {
  const { mutateAsync: updateChat } = useUpdateChat();
  const isStreamFinished = !isStreamingMessage;

  if (!chatTitle) {
    return <div />; //we need to return something for alignment
  }

  return (
    <AnimatePresence mode="wait" initial={isStreamFinished}>
      <motion.div
        {...(isStreamFinished ? {} : animation)}
        key={chatTitle || 'initial'}
        transition={{
          duration: isStreamFinished ? 0 : 0.2,
        }}
        className="flex w-full items-center overflow-hidden"
      >
        <EditableTitle
          className="w-full"
          level={5}
          disabled={!chatTitle}
          id={CHAT_HEADER_TITLE_ID}
          onChange={(value) =>
            value && value !== chatTitle && updateChat({ id: chatId, title: value })
          }
        >
          {chatTitle}
        </EditableTitle>
      </motion.div>
    </AnimatePresence>
  );
};
