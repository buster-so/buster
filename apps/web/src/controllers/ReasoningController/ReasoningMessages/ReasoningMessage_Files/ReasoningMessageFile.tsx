import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import type { BusterChatMessageReasoning_files } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';
import { ReasoningFileButtons } from './ReasoningFileButtons';
import { StreamingMessageStatus } from './StreamingMessageStatus';

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

    const { status, file_type, id, version_number } = file || {};

    const buttons = useMemo(() => {
      if (!file || !status || !file_type || !id) return null;

      return !isCompletedStream ? (
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
    }, [isCompletedStream, status, file_type, chatId, id, version_number]);

    const collapsible: 'overlay-peek' | false = useMemo(() => {
      if (file_type === 'agent-action') return 'overlay-peek';
      return false;
    }, [file_type]);

    if (isEmpty(file)) {
      return null;
    }

    return (
      <StreamingMessageCode
        {...file}
        collapsible={collapsible}
        buttons={buttons}
        isCompletedStream={isCompletedStream}
      />
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';
