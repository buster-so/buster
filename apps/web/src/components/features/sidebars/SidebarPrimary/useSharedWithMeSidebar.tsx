import { useMemo } from 'react';
import { useSharingAssetsInfinite } from '@/api/buster_rest/sharing';
import UsersPlus from '@/components/ui/icons/NucleoIconOutlined/users-plus';
import type { ISidebarGroup, ISidebarItem, ISidebarList } from '@/components/ui/sidebar';

export const useSharedWithMeSidebar = (): ISidebarList => {
  const { allResults } = useSharingAssetsInfinite({
    enabled: true,
  });

  const hasResults = allResults.length > 0;

  return useMemo(() => {
    return {
      items: [
        {
          label: 'Shared with me',
          icon: <UsersPlus />,
          id: 'shared-with-me',
          link: {
            to: '/app/shared-with-me',
          },
        },
      ],
      id: 'shared-with-me',
    } satisfies ISidebarList;
  }, [hasResults]);
};
