import type {
  BusterChatMessageReasoning_file,
  BusterChatMessageReasoning_files
} from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { CheckDouble } from '@/components/ui/icons';
import { CircleWarning } from '@/components/ui/icons/NucleoIconFilled';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';
import { Text } from '@/components/ui/typography';
import { AnimatePresence, motion } from 'framer-motion';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import { ReasoningFileButtons } from './ReasoningFileButtons';

export type ReasoningMessageFileProps = {
  chatId: string;
  fileId: string;
  messageId: string;
  reasoningMessageId: string;
  isCompletedStream: boolean;
};

export const ReasoningMessage_File: React.FC<ReasoningMessageFileProps> = React.memo(
  ({ isCompletedStream, fileId, chatId, messageId, reasoningMessageId }) => {
    const { data: file } = useGetChatMessage(messageId, {
      select: (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files)?.files?.[
          fileId
        ]
    });

    if (isEmpty(file)) return null;

    const { status, file_type, id, version_number } = file;

    const buttons = !isCompletedStream ? (
      <StreamingMessageStatus status={status} />
    ) : (
      <ReasoningFileButtons
        fileType={file_type}
        chatId={chatId}
        fileId={id}
        versionNumber={version_number}
        type="file"
      />
    );

    return (
      <StreamingMessageCode {...file} buttons={buttons} isCompletedStream={isCompletedStream} />
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';

export const StreamingMessageStatus = React.memo(
  ({ status }: { status: BusterChatMessageReasoning_file['status'] }) => {
    const content = useMemo(() => {
      if (status === 'loading')
        return (
          <div className="flex items-center gap-1.5">
            <Text variant={'secondary'} size={'sm'}>
              Running SQL...
            </Text>
            <CircleSpinnerLoader size={9} fill={'var(--color-text-primary)'} />
          </div>
        );
      if (status === 'completed')
        return (
          <Text variant={'secondary'} size={'sm'} className="flex items-center gap-1.5">
            Completed <CheckDouble />
          </Text>
        );
      if (status === 'failed')
        return (
          <Text variant={'danger'} size={'sm'} className="flex items-center gap-1.5">
            Failed <CircleWarning />
          </Text>
        );
    }, [status]);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key={status}>
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }
);

StreamingMessageStatus.displayName = 'StreamingMessageStatus';
