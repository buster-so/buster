'use client';

import type { BusterChatMessageRequest } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { Copy, PenWriting } from '@/components/ui/icons';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { Tooltip } from '@/components/ui/tooltip';
import { Paragraph } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { useMemoizedFn, useMount } from '@/hooks';
import { cn } from '@/lib/classMerge';
import React, { useState, useRef } from 'react';
import { MessageContainer } from './MessageContainer';

export const ChatUserMessage: React.FC<{
  messageId: string;
  chatId: string;
  isCompletedStream: boolean;
  requestMessage: NonNullable<BusterChatMessageRequest>;
}> = React.memo(({ messageId, chatId, isCompletedStream, requestMessage }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { sender_avatar, sender_id, sender_name, request } = requestMessage;

  const onSetIsEditing = useMemoizedFn((isEditing: boolean) => {
    setIsEditing(isEditing);
    setIsTooltipOpen(false);
  });

  const handleCopy = useMemoizedFn((e?: React.ClipboardEvent) => {
    // Prevent default copy behavior
    //I do not know why this is needed, but it is...
    if (e?.clipboardData) {
      e.preventDefault();
      e.clipboardData.setData('text/plain', request);
    } else {
      navigator.clipboard.writeText(request);
    }
    openSuccessMessage('Copied to clipboard');
  });

  return (
    <MessageContainer
      senderName={sender_name}
      senderId={sender_id}
      senderAvatar={sender_avatar}
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}>
      {isEditing ? (
        <EditMessage
          messageId={messageId}
          chatId={chatId}
          requestMessage={requestMessage}
          onSetIsEditing={onSetIsEditing}
        />
      ) : (
        <>
          <div>
            <Paragraph className="break-words whitespace-pre-wrap" onCopy={handleCopy}>
              {request}
            </Paragraph>
          </div>
          {isCompletedStream && (
            <RequestMessageTooltip
              isTooltipOpen={isTooltipOpen}
              requestMessage={requestMessage}
              setIsEditing={setIsEditing}
              onCopy={handleCopy}
            />
          )}
        </>
      )}
    </MessageContainer>
  );
});

ChatUserMessage.displayName = 'ChatUserMessage';

const RequestMessageTooltip: React.FC<{
  isTooltipOpen: boolean;
  requestMessage: NonNullable<BusterChatMessageRequest>;
  setIsEditing: (isEditing: boolean) => void;
  onCopy: () => void;
}> = React.memo(({ isTooltipOpen, requestMessage, setIsEditing, onCopy }) => {
  const { openSuccessMessage } = useBusterNotifications();

  const onEdit = useMemoizedFn(() => {
    setIsEditing(true);
  });

  return (
    <div
      className={cn(
        'absolute top-0 right-1 -translate-y-1 transform',
        'bg-background z-50 rounded border shadow',
        'transition-all duration-200',
        isTooltipOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}>
      <Tooltip title={'Edit'} side={'bottom'}>
        <Button
          prefix={<PenWriting />}
          className="hover:bg-item-select!"
          variant={'ghost'}
          onClick={onEdit}
        />
      </Tooltip>
      <Tooltip title={'Copy'} side={'bottom'}>
        <Button
          prefix={<Copy />}
          className="hover:bg-item-select!"
          variant={'ghost'}
          onClick={onCopy}
        />
      </Tooltip>
    </div>
  );
});

RequestMessageTooltip.displayName = 'RequestMessageTooltip';

const EditMessage: React.FC<{
  requestMessage: NonNullable<BusterChatMessageRequest>;
  onSetIsEditing: (isEditing: boolean) => void;
  messageId: string;
  chatId: string;
}> = React.memo(({ requestMessage, onSetIsEditing, messageId, chatId }) => {
  const [prompt, setPrompt] = useState(requestMessage.request);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const onReplaceMessageInChat = useBusterNewChatContextSelector((x) => x.onReplaceMessageInChat);

  const onSave = useMemoizedFn(() => {
    onReplaceMessageInChat({
      chatId,
      messageId,
      prompt
    });
    onSetIsEditing(false);
  });

  useMount(() => {
    // Using requestAnimationFrame to ensure the DOM is ready
    requestAnimationFrame(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        textAreaRef.current.select();
      }
    });
  });

  return (
    <div className="-mt-1 flex flex-col space-y-2">
      <InputTextArea
        ref={textAreaRef}
        autoResize={{ minRows: 3, maxRows: 10 }}
        value={prompt}
        onPressEnter={onSave}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="flex justify-end space-x-2">
        <Button variant={'ghost'} onClick={() => onSetIsEditing(false)}>
          Cancel
        </Button>
        <Button variant={'black'} onClick={onSave}>
          Submit
        </Button>
      </div>
    </div>
  );
});
