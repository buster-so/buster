import { useNavigate, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces';
import { useDeleteChat, useDuplicateChat, useGetChat } from '@/api/buster_rest/chats';
import { useFavoriteStar } from '@/components/features/favorites';
import { createDropdownItem } from '@/components/ui/dropdown';
import { ArrowRight, DuplicatePlus, Pencil, ShareRight, Star, Trash } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { ensureElementExists } from '@/lib/element';
import { getIsEffectiveOwner } from '@/lib/share';
import { timeout } from '@/lib/timeout';
import { getShareAssetConfig, ShareMenuContent } from '../ShareMenu';
import { CHAT_HEADER_TITLE_ID } from './ChatHeaderTitle';

export const useShareMenuSelectMenu = ({ chatId = '' }: { chatId: string | undefined }) => {
  const { data: shareAssetConfig } = useGetChat({ id: chatId }, { select: getShareAssetConfig });
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share',
      value: 'share-report',
      icon: <ShareRight />,
      disabled: !isEffectiveOwner,
      items:
        isEffectiveOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={chatId}
                shareAssetConfig={shareAssetConfig}
                assetId={chatId}
                assetType={'chat'}
              />,
            ]
          : undefined,
    }),
    [chatId, shareAssetConfig, isEffectiveOwner]
  );
};

export const useRenameChatTitle = () => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Rename',
        value: 'edit-chat-title',
        icon: <Pencil />,
        onClick: async (e) => {
          e.stopPropagation();
          e.preventDefault();
          const input = await ensureElementExists(
            () => document.getElementById(CHAT_HEADER_TITLE_ID) as HTMLInputElement
          );
          if (input) {
            // Focus first, then select after a small delay to ensure focus completes
            input.focus();
            setTimeout(() => {
              input.select(); //i think this is related to how the dropdown is closing and taking away focus
            }, 200);
          }
        },
      }),
    []
  );
};

const stableChatTitleSelector = (chat: IBusterChat) => chat.title;
export const useFavoriteChatSelectMenu = ({ chatId = '' }: { chatId: string | undefined }) => {
  const { data: chatTitle } = useGetChat(
    { id: chatId || '' },
    { select: stableChatTitleSelector, enabled: !!chatId }
  );
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: chatId || '',
    type: 'chat',
    name: chatTitle || '',
  });

  return useMemo(() => {
    return createDropdownItem({
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      value: 'add-to-favorites',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: () => onFavoriteClick(),
      closeOnSelect: false,
    });
  }, [isFavorited, onFavoriteClick]);
};

export const useOpenInNewTabSelectMenu = ({ chatId = '' }: { chatId: string | undefined }) => {
  const router = useRouter();
  return useMemo(() => {
    return createDropdownItem({
      label: 'Open in new tab',
      value: 'open-in-new-tab',
      icon: <ArrowRight />,
      onClick: () => {
        if (chatId) {
          const link = router.buildLocation({
            to: '/app/chats/$chatId',
            params: { chatId: chatId },
          });
          window.open(link.href, '_blank');
        }
      },
    });
  }, [chatId, router.buildLocation]);
};

export const useDuplicateChatSelectMenu = ({ chatId = '' }: { chatId: string | undefined }) => {
  const { mutateAsync: duplicateChat, isPending: isDuplicating } = useDuplicateChat();
  const navigate = useNavigate();
  const { openSuccessMessage } = useBusterNotifications();

  return useMemo(() => {
    return createDropdownItem({
      label: 'Duplicate',
      value: 'duplicate',
      icon: <DuplicatePlus />,
      loading: isDuplicating,
      onClick: async () => {
        if (chatId) {
          const res = await duplicateChat({ id: chatId });
          await timeout(100);
          await navigate({ to: '/app/chats/$chatId', params: { chatId: res.id } });
          openSuccessMessage('Chat duplicated');
        }
      },
    });
  }, [chatId, isDuplicating, duplicateChat, navigate, openSuccessMessage]);
};

export const useDeleteChatSelectMenu = ({ chatId = '' }: { chatId: string | undefined }) => {
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat();
  const navigate = useNavigate();
  const { openSuccessMessage } = useBusterNotifications();

  return useMemo(() => {
    return createDropdownItem({
      label: 'Delete',
      value: 'delete',
      icon: <Trash />,
      loading: isDeleting,
      onClick: () =>
        chatId &&
        deleteChat(
          { data: [chatId] },
          {
            onSuccess: () => {
              navigate({ to: '/app/chats' });
              openSuccessMessage('Chat deleted');
            },
          }
        ),
    });
  }, [chatId, isDeleting, deleteChat, navigate, openSuccessMessage]);
};
