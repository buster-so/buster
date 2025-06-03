import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { StreamingMessage_File } from '@/components/ui/streaming/StreamingMessage_File';
import React from 'react';

export const ChatResponseMessage_StandardFile: React.FC<{
  isCompletedStream: boolean;
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
}> = React.memo(({ isCompletedStream, responseMessage, isSelectedFile, chatId }) => {
  return (
    <StreamingMessage_File
      isCompletedStream={isCompletedStream}
      responseMessage={responseMessage}
      isSelectedFile={isSelectedFile}
    />
  );
});

ChatResponseMessage_StandardFile.displayName = 'ChatResponseMessage_StandardFile';
