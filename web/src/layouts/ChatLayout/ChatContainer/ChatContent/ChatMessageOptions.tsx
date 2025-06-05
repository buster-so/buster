import React from 'react';
import {
  useDuplicateChat,
  useGetChatMessage,
  useUpdateChatMessageFeedback
} from '@/api/buster_rest/chats';
import { Button } from '@/components/ui/buttons';
import { DuplicatePlus, ThumbsDown } from '@/components/ui/icons';
import { ThumbsDown as ThumbsDownFilled } from '@/components/ui/icons/NucleoIconFilled';
import { AppTooltip } from '@/components/ui/tooltip';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';
import { BusterRoutes } from '@/routes';

export const ChatMessageOptions: React.FC<{
  messageId: string;
  chatId: string;
}> = React.memo(({ messageId, chatId }) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { mutateAsync: duplicateChat, isPending: isCopying } = useDuplicateChat();
  const { mutateAsync: updateChatMessageFeedback } = useUpdateChatMessageFeedback();
  const { data: feedback } = useGetChatMessage(messageId, {
    select: ({ feedback }) => feedback
  });

  const { openConfirmModal } = useBusterNotifications();

  const warnBeforeDuplicate = useMemoizedFn(() => {
    openConfirmModal({
      title: 'Duplicate chat',
      content:
        'You are about to duplicate this chat from this message. This will create a new chat with the same messages. Do you want to continue?',
      onOk: async () => {
        const res = await duplicateChat({
          id: chatId,
          message_id: messageId
        });
        await timeout(100);
        await onChangePage({
          route: BusterRoutes.APP_CHAT_ID,
          chatId: res.id
        });
      }
    });
  });

  return (
    <div className="flex items-center gap-1">
      <AppTooltip title="Duplicate chat from this message">
        <Button
          variant="ghost"
          prefix={<DuplicatePlus />}
          loading={isCopying}
          onClick={warnBeforeDuplicate}
        />
      </AppTooltip>
      <AppTooltip title="Report message">
        <Button
          variant="ghost"
          prefix={feedback === 'negative' ? <ThumbsDownFilled /> : <ThumbsDown />}
          onClick={() =>
            updateChatMessageFeedback({
              message_id: messageId,
              feedback: feedback === 'negative' ? null : 'negative'
            })
          }
        />
      </AppTooltip>
    </div>
  );
});

ChatMessageOptions.displayName = 'ChatMessageOptions';
