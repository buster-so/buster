import { useMemo } from 'react';
import Gear from '@/components/ui/icons/NucleoIconOutlined/gear';
import Table from '@/components/ui/icons/NucleoIconOutlined/table';
import UnorderedList2 from '@/components/ui/icons/NucleoIconOutlined/unordered-list-2';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import {
  createSidebarGroup,
  createSidebarItems,
} from '@/components/ui/sidebar/create-sidebar-item';
import type { SidebarPrimaryProps } from './SidebarPrimary';

export const ADMIN_TOOLS_SIDEBAR_ID = 'admin-tools';

export const useAdminToolSidebar = ({
  defaultOpenAdminTools = true,
}: Pick<SidebarPrimaryProps, 'defaultOpenAdminTools'>) => {
  return useMemo(() => {
    const adminTools: ISidebarGroup = createSidebarGroup({
      label: 'Admin tools',
      id: ADMIN_TOOLS_SIDEBAR_ID,
      icon: <Gear />,
      defaultOpen: defaultOpenAdminTools,
      items: createSidebarItems([
        {
          label: 'Logs',
          icon: <UnorderedList2 />,
          link: { to: '/app/logs', preload: 'viewport', preloadDelay: 1000 },
          id: '/app/logs/',
          collapsedTooltip: 'Logs',
        },
        {
          label: 'Datasets',
          icon: <Table />,
          link: { to: '/app/datasets' },
          id: '/app/datasets/',
          collapsedTooltip: 'Datasets',
        },
      ]),
    });
    return adminTools;
  }, [defaultOpenAdminTools]);
};
