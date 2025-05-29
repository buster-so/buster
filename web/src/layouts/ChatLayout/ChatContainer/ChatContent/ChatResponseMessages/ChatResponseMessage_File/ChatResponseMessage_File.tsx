import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import type {
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_fileMetadata
} from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { StatusIndicator } from '@/components/ui/indicators';
import { StreamingMessage_File } from '@/components/ui/streaming/StreamingMessage_File';
import { Text } from '@/components/ui/typography';
import { TextAndVersionPill } from '@/components/ui/typography/TextAndVersionPill';
import { useMount } from '@/hooks';
import type { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { useGetFileHref } from './useGetFileHref';
import { useGetIsSelectedFile } from './useGetIsSelectedFile';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ isCompletedStream, chatId, responseMessageId, messageId }) => {
    const router = useRouter();
    const { data } = useGetChatMessage(messageId, {
      select: (x) => x?.response_messages?.[responseMessageId]
    });
    const responseMessage = data as BusterChatResponseMessage_file;

    const { isSelectedFile } = useGetIsSelectedFile({ responseMessage });

    const href = useGetFileHref({ responseMessage, isSelectedFile, chatId });

    useMount(() => {
      if (href) {
        router.prefetch(href);
      }
    });

    return (
      <Link href={href} prefetch data-testid="chat-response-message-file">
        <StreamingMessage_File
          isCompletedStream={isCompletedStream}
          responseMessage={responseMessage}
          isSelectedFile={isSelectedFile}
        />
      </Link>
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';

const ChatResponseMessageHeader: React.FC<{ file_name: string; version_number: number }> =
  React.memo(({ file_name, version_number }) => {
    return (
      <div className="file-header bg-item-hover border-border flex h-8 w-full overflow-hidden border-b px-2.5">
        <TextAndVersionPill fileName={file_name} versionNumber={version_number} />
      </div>
    );
  });

ChatResponseMessageHeader.displayName = 'ChatResponseMessageHeader';

const ChatResponseMessageBody: React.FC<{
  metadata: BusterChatResponseMessage_fileMetadata[];
}> = React.memo(({ metadata }) => {
  return (
    <div className="flex w-full flex-col items-center space-y-0.5 px-2.5 py-2">
      {metadata.map((metadata, index) => (
        <MetadataItem
          metadata={metadata}
          key={`${metadata.message}-${metadata.status}-${metadata.timestamp}-${index}`}
        />
      ))}
    </div>
  );
});

ChatResponseMessageBody.displayName = 'ChatResponseMessageBody';

const MetadataItem: React.FC<{ metadata: BusterChatResponseMessage_fileMetadata }> = ({
  metadata
}) => {
  const { status, message, timestamp } = metadata;

  const timestampFormatted = useMemo(() => {
    if (!timestamp) return '';
    return `${timestamp} seconds`;
  }, [timestamp]);

  return (
    <div
      className="@container flex w-full items-center justify-start space-x-1.5 overflow-hidden"
      style={{
        containerType: 'inline-size'
      }}>
      <div>
        <StatusIndicator status={status} />
      </div>

      <Text truncate size="xs" variant="secondary">
        {message}
      </Text>

      {timestamp && (
        <Text variant="tertiary" className="whitespace-nowrap @[190px]:hidden" size="xs">
          {timestampFormatted}
        </Text>
      )}
    </div>
  );
};
