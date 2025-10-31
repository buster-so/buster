import type { ChatListItem } from '@buster/server-shared/chats';
import { useMemo } from 'react';
import { useGetListChats } from '@/api/buster_rest/chats';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { createSidebarItem } from '@/components/ui/sidebar/create-sidebar-item';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { defineLink } from '@/lib/routes';
import { ASSET_ICONS } from '../../icons/assetIcons';
import type { SidebarPrimaryProps } from './SidebarPrimary';

export const CHAT_HISTORY_SIDEBAR_ITEMS_LIMIT = 10;
export const CHAT_HISTORY_SIDEBAR_ID = 'chat-history';

const getLink = (chat: ChatListItem) => {
  try {
    const link = assetParamsToRoute({
      chatId: chat.id,
      assetId: chat.latest_file_id || '',
      assetType: chat.latest_file_type,
      versionNumber: chat.latest_version_number,
    });
    return link;
  } catch (error) {
    if (chat.id) {
      return defineLink({
        to: '/app/chats/$chatId',
        params: {
          chatId: chat.id,
        },
      });
    }
    return defineLink({
      to: '/app/home',
    });
  }
};

export const useChatHistorySidebar = ({
  defaultOpenChatHistory = true,
}: Pick<SidebarPrimaryProps, 'defaultOpenChatHistory'>): ISidebarGroup | null => {
  const { data } = useGetListChats({
    page: 1,
    page_size: CHAT_HISTORY_SIDEBAR_ITEMS_LIMIT,
  });

  const chatHistoryItems: ISidebarGroup | null = useMemo(() => {
    if (!data || data.length === 0) return null;

    const items = data.map((c) => {
      return createSidebarItem({
        id: c.id,
        label: c.name,
        link: getLink(c),
      });
    });

    items.push(
      createSidebarItem({
        id: 'all-chats',
        label: 'See all',
        link: {
          to: '/app/chats',
          preload: 'intent',
        },
        className: 'bg-transparent! hover:underline text-text-secondary text-sm',
      })
    );

    return {
      label: 'Chat history',
      icon: <ASSET_ICONS.chats />,
      link: {
        to: '/app/chats',
        preload: 'viewport',
        preloadDelay: 2000,
        activeOptions: {
          exact: true,
        },
      },
      id: CHAT_HISTORY_SIDEBAR_ID,
      items,
      defaultOpen: defaultOpenChatHistory,
    } satisfies ISidebarGroup;
  }, [data, defaultOpenChatHistory]);

  return chatHistoryItems;
};
