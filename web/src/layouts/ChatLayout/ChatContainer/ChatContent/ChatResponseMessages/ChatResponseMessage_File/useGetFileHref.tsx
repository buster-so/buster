import { useMemo } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const useGetFileHref = ({
  responseMessage,
  isSelectedFile,
  chatId
}: {
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
}) => {
  const { file_type, id, version_number } = responseMessage;

  const { getFileLink } = useGetFileLink();

  const href = useMemo(() => {
    if (!chatId) return '';

    if (isSelectedFile) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID,
        chatId
      });
    }

    const link = getFileLink({
      fileId: id,
      fileType: file_type,
      chatId,
      versionNumber: version_number,
      useVersionHistoryMode: false
    });

    return link || '';
  }, [chatId, file_type, id, version_number, isSelectedFile]);

  return href;
};
