import React, { useMemo } from 'react';
import { ShareAssetType } from '@buster/server-shared/share';
import { useDeleteChat, useDuplicateChat, useGetChat } from '@/api/buster_rest/chats';
import { useFavoriteStar } from '@/components/features/list';
import { Dropdown, type DropdownItems } from '@/components/ui/dropdown';
import { DuplicatePlus, Pencil, Star, Trash } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { timeout } from '@/lib';
import { assetParamsToRoute } from '@/lib/assets';
import { BusterRoutes } from '@/routes';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { CHAT_HEADER_TITLE_ID } from '../ChatHeaderTitle';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat();
  const { mutateAsync: duplicateChat, isPending: isDuplicating } = useDuplicateChat();
  const selectedFileId = useChatIndividualContextSelector((state) => state.selectedFileId);
  const selectedFileType = useChatIndividualContextSelector((state) => state.selectedFileType);
  const { data: chatTitle } = useGetChat(
    { id: chatId || '' },
    { select: (x) => x.title, enabled: !!chatId }
  );

  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: chatId || '',
    type: 'chat',
    name: chatTitle || ''
  });

  const menuItem: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        value: 'delete',
        icon: <Trash />,
        loading: isDeleting,
        onClick: () =>
          chatId &&
          deleteChat(
            { data: [chatId] },
            {
              onSuccess: () => {
                onChangePage({ route: BusterRoutes.APP_CHAT });
                openSuccessMessage('Chat deleted');
              }
            }
          )
      },
      {
        label: 'Duplicate chat',
        value: 'duplicate',
        icon: <DuplicatePlus />,
        loading: isDuplicating,
        onClick: async () => {
          if (chatId) {
            const res = await duplicateChat({ id: chatId });
            await timeout(100);
            if (selectedFileType && selectedFileId) {
              const route = assetParamsToRoute({
                assetId: selectedFileId,
                chatId: res.id,
                type: selectedFileType
              });

              if (route) await onChangePage(route);
            } else {
              await onChangePage({ route: BusterRoutes.APP_CHAT_ID, chatId: res.id });
            }

            openSuccessMessage('Chat duplicated');
          }
        }
      },
      {
        label: 'Edit chat title',
        value: 'edit-chat-title',
        icon: <Pencil />,
        onClick: async () => {
          const input = document.getElementById(CHAT_HEADER_TITLE_ID) as HTMLInputElement;
          if (input) {
            await timeout(25);
            input.focus();
            input.select();
          }
        }
      },
      {
        label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
        value: 'add-to-favorites',
        icon: isFavorited ? <StarFilled /> : <Star />,
        onClick: onFavoriteClick
      }
    ];
  }, [
    chatId,
    isDeleting,
    isDuplicating,
    deleteChat,
    duplicateChat,
    isFavorited,
    onFavoriteClick,
    openSuccessMessage,
    onChangePage,
    selectedFileType,
    selectedFileId
  ]);

  return (
    <Dropdown align="end" items={menuItem}>
      {chatId ? children : null}
    </Dropdown>
  );
};

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
