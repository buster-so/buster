import { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import { StreamingMessage_File } from '@/components/ui/streaming/StreamingMessage_File';
import Link from 'next/link';
import React from 'react';

export const ChatResponseMessage_StandardFile: React.FC<{
  isCompletedStream: boolean;
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
  href: string;
}> = React.memo(({ isCompletedStream, responseMessage, isSelectedFile, chatId, href }) => {
  return (
    <Link href={href} prefetch data-testid="chat-response-message-file">
      <StreamingMessage_File
        isCompletedStream={isCompletedStream}
        responseMessage={responseMessage}
        isSelectedFile={isSelectedFile}
      />
    </Link>
  );
});

ChatResponseMessage_StandardFile.displayName = 'ChatResponseMessage_StandardFile';
