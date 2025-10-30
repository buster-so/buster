import type React from 'react';
import { useMemo } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces';
import { useGetChat } from '@/api/buster_rest/chats';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { useAddToLibraryCollection } from '../library/useAddToLibraryCollection';
import {
  useDeleteChatSelectMenu,
  useDuplicateChatSelectMenu,
  useFavoriteChatSelectMenu,
  useOpenInNewTabSelectMenu,
  useRenameChatTitle,
  useShareMenuSelectMenu,
} from './threeDotMenuHooks';

const stablePermissionSelector = (chat: IBusterChat) => chat.permission;

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const chatId = useGetChatId();
  const { data: permission } = useGetChat(
    { id: chatId || '' },
    { select: stablePermissionSelector }
  );
  const shareMenu = useShareMenuSelectMenu({ chatId });
  const renameChatTitle = useRenameChatTitle();
  const addToLibraryCollectionMenu = useAddToLibraryCollection({
    assetId: chatId || '',
    assetType: 'chat',
  });
  const favoriteChat = useFavoriteChatSelectMenu({ chatId });
  const openInNewTab = useOpenInNewTabSelectMenu({ chatId });
  const duplicateChat = useDuplicateChatSelectMenu({ chatId });
  const deleteChat = useDeleteChatSelectMenu({ chatId });

  const isOwnerEffective = getIsEffectiveOwner(permission);
  const canEditChat = canEdit(permission);

  const menuItem: IDropdownItems = useMemo(() => {
    return [
      isOwnerEffective && shareMenu,
      isOwnerEffective && renameChatTitle,
      ...(canEditChat ? addToLibraryCollectionMenu : []),
      favoriteChat,
      openInNewTab,
      { type: 'divider' },
      canEditChat && duplicateChat,
      isOwnerEffective && deleteChat,
    ].filter(Boolean) as IDropdownItems;
  }, [
    chatId,
    isOwnerEffective,
    canEditChat,
    shareMenu,
    renameChatTitle,
    addToLibraryCollectionMenu,
    favoriteChat,
    openInNewTab,
    duplicateChat,
    deleteChat,
  ]);

  return (
    <Dropdown align="end" items={menuItem}>
      {chatId ? children : null}
    </Dropdown>
  );
};

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
