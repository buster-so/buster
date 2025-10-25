import { useMemo } from 'react';
import { useGetListChats } from '@/api/buster_rest/chats';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { createSidebarItem } from '@/components/ui/sidebar/create-sidebar-item';
import { ASSET_ICONS } from '../../icons/assetIcons';

export const useChatHistorySidebar = (): ISidebarGroup | null => {
  const { data } = useGetListChats({
    page: 1,
    page_size: 10,
  });

  const chatHistoryItems: ISidebarGroup | null = useMemo(() => {
    if (!data || data.length === 0) return null;

    const items = data.map((c) => {
      return createSidebarItem({
        id: c.id,
        label: c.name,
        link: {
          to: `/app/chats/$chatId`,
          params: {
            chatId: c.id,
          },
        },
      });
    });

    items.push(
      createSidebarItem({
        id: 'all-chats',
        label: 'See chats',
        link: {
          to: '/app/chats',
          preload: 'intent',
        },
        className: 'bg-transparent! hover:underline',
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
      id: '/app/chats/',
      items,
    } satisfies ISidebarGroup;
  }, [data]);

  return chatHistoryItems;
};
