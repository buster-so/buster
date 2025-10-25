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
      items: data.map((c) => {
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
      }),
    } satisfies ISidebarGroup;
  }, [data]);

  return chatHistoryItems;
};
