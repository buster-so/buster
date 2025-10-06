import React, { useCallback, useMemo } from 'react';
import type { BusterChatMessage, BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useIsEmbed } from '@/context/BusterAssets/useIsEmbed';
import { createChatAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import type { ILinkProps } from '@/types/routes';
import type { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { ChatResponseMessage_DashboardFile } from './ChatResponseMessage_DashboardFile';
import { ChatResponseMessage_StandardFile } from './ChatResponseMessage_StandardFile';
import { useGetIsSelectedFile } from './useGetIsSelectedFile';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ isStreamFinished, chatId, responseMessageId, messageId }) => {
    const { data } = useGetChatMessage(messageId, {
      select: useCallback(
        (x: BusterChatMessage) => x?.response_messages?.[responseMessageId],
        [responseMessageId]
      ),
      notifyOnChangeProps: ['data'],
    });
    const responseMessage = data as BusterChatResponseMessage_file;
    const { file_type } = responseMessage;

    const { isSelectedFile } = useGetIsSelectedFile({ responseMessage });
    const isEmbed = useIsEmbed();

    const linkParams = createChatAssetRoute({
      asset_type: file_type,
      id: responseMessage.id,
      chatId,
      versionNumber: responseMessage.version_number,
      isEmbed,
    }) as unknown as ILinkProps;

    const SelectedComponent = useMemo(() => {
      if (file_type === 'dashboard_file') {
        return ChatResponseMessage_DashboardFile;
      }
      if (file_type === 'report_file') {
        return ChatResponseMessage_StandardFile;
      }
      if (file_type === 'metric_file') {
        return ChatResponseMessage_StandardFile;
      }
      if (file_type === 'reasoning') {
        return ChatResponseMessage_StandardFile;
      }
      const _exhaustiveCheck: never = file_type;
      return ChatResponseMessage_StandardFile;
    }, [file_type]);

    if (!data) return null;

    return (
      <SelectedComponent
        isStreamFinished={isStreamFinished}
        responseMessage={responseMessage}
        isSelectedFile={isSelectedFile}
        chatId={chatId}
        linkParams={linkParams}
      />
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';
