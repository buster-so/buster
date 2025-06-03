import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useMount } from '@/hooks';
import type { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { useGetFileHref } from './useGetFileHref';
import { useGetIsSelectedFile } from './useGetIsSelectedFile';
import { ChatResponseMessage_DashboardFile } from './ChatResponseMessage_DashboardFile';
import { ChatResponseMessage_StandardFile } from './ChatResponseMessage_StandardFile';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ isCompletedStream, chatId, responseMessageId, messageId }) => {
    const router = useRouter();
    const { data } = useGetChatMessage(messageId, {
      select: (x) => x?.response_messages?.[responseMessageId]
    });
    const responseMessage = data as BusterChatResponseMessage_file;
    const { file_type } = responseMessage;

    const { isSelectedFile } = useGetIsSelectedFile({ responseMessage });

    const href = useGetFileHref({ responseMessage, isSelectedFile, chatId });

    useMount(() => {
      if (href) {
        router.prefetch(href);
      }
    });

    const SelectedComponent = useMemo(() => {
      if (file_type === 'dashboard') {
        return ChatResponseMessage_DashboardFile;
      }
      return ChatResponseMessage_StandardFile;
    }, [file_type]);

    return (
      <Link href={href} prefetch data-testid="chat-response-message-file">
        <SelectedComponent
          isCompletedStream={isCompletedStream}
          responseMessage={responseMessage}
          isSelectedFile={isSelectedFile}
        />
      </Link>
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';
