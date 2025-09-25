import React, { useCallback, useRef, useState } from 'react';
import type { BusterChatMessageRequest } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { Copy } from '@/components/ui/icons';
import PenWriting from '@/components/ui/icons/NucleoIconOutlined/pen-writing';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { Tooltip } from '@/components/ui/tooltip';
import { Paragraph } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useChatPermission } from '@/context/Chats';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/classMerge';
import { canEdit } from '@/lib/share';
import { useChat } from '../../../context/Chats/useChat';
import { MessageContainer } from './MessageContainer';

export const ChatUserMessage: React.FC<{
  messageId: string;
  chatId: string;
  isStreamFinished: boolean;
  requestMessage: NonNullable<BusterChatMessageRequest>;
}> = React.memo(({ messageId, chatId, isStreamFinished, requestMessage }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const permission = useChatPermission(chatId);
  const canEditChat = canEdit(permission);

  const { sender_avatar, sender_id, sender_name, request } = requestMessage;

  const onSetIsEditing = useCallback((isEditing: boolean) => {
    setIsEditing(isEditing);
    setIsTooltipOpen(false);
  }, []);

  const handleCopy = useCallback(
    (e?: React.ClipboardEvent) => {
      // Check if user has selected text
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() || '';
      const hasSelection = selectedText.length > 0;

      // Always override copy behavior to provide clean text
      if (e?.clipboardData) {
        e.preventDefault();
        // Copy selected text if there is a selection, otherwise copy full message
        e.clipboardData.setData('text/plain', hasSelection ? selectedText : request || '');
      } else {
        navigator.clipboard.writeText(hasSelection ? selectedText : request || '');
      }
      openSuccessMessage('Copied to clipboard');
    },
    [openSuccessMessage, request]
  );

  return (
    <MessageContainer
      senderName={sender_name}
      senderId={sender_id}
      senderAvatar={sender_avatar}
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
    >
      {isEditing ? (
        <EditMessage
          messageId={messageId}
          chatId={chatId}
          requestMessage={requestMessage}
          onSetIsEditing={onSetIsEditing}
        />
      ) : (
        <>
          <Paragraph className="break-words whitespace-pre-line" onCopy={handleCopy}>
            {request}
          </Paragraph>

          {isStreamFinished && canEditChat && (
            <RequestMessageTooltip
              isTooltipOpen={isTooltipOpen}
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
  setIsEditing: (isEditing: boolean) => void;
  onCopy: () => void;
}> = React.memo(({ isTooltipOpen, setIsEditing, onCopy }) => {
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
      )}
    >
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
  const [prompt, setPrompt] = useState(requestMessage.request || '');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { onReplaceMessageInChat } = useChat();

  const onSave = useMemoizedFn(() => {
    onReplaceMessageInChat({
      chatId,
      messageId,
      prompt: prompt || '',
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
    <div className="-mt-0.5 flex flex-col space-y-2">
      <InputTextArea
        ref={textAreaRef}
        minRows={3}
        maxRows={10}
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

EditMessage.displayName = 'EditMessage';
