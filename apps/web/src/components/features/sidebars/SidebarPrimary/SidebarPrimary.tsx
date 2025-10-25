import type { AssetType } from '@buster/server-shared/assets';
import { Link, useNavigate } from '@tanstack/react-router';
import React, { lazy, Suspense, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  useIsAnonymousUser,
  useIsUserAdmin,
  useIsUserRegistered,
  useRestrictNewUserInvitations,
} from '@/api/buster_rest/users/useGetUserInfo';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { Button } from '@/components/ui/buttons';
import { Flag, Magnifier, Plus, Table, UnorderedList2 } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
import Compose2 from '@/components/ui/icons/NucleoIconOutlined/compose-2';
import FolderContent from '@/components/ui/icons/NucleoIconOutlined/folder-content';
import Gear from '@/components/ui/icons/NucleoIconOutlined/gear';
import Settings from '@/components/ui/icons/NucleoIconOutlined/users-settings';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_JUSTIFY_CENTER,
  COLLAPSED_VISIBLE,
  type ISidebarGroup,
  type ISidebarItem,
  type ISidebarList,
  type SidebarProps,
} from '@/components/ui/sidebar';
import {
  createSidebarGroup,
  createSidebarItem,
  createSidebarItems,
  createSidebarList,
} from '@/components/ui/sidebar/create-sidebar-item';
import { Sidebar } from '@/components/ui/sidebar/SidebarComponent';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { toggleContactSupportModal } from '@/context/GlobalStore/useContactSupportModalStore';
import { toggleInviteModal } from '@/context/GlobalStore/useInviteModalStore';
import { cn } from '@/lib/classMerge';
import { LazyErrorBoundary } from '../../global/LazyErrorBoundary';
import { toggleGlobalSearch } from '../../search/GlobalSearchModal';
import { SidebarUserFooter } from '../SidebarUserFooter';
import { useChatHistorySidebar } from './useChatHistorySidebar';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

const LazyGlobalModals = lazy(() => import('./PrimaryGlobalModals'));

const topItems: ISidebarList = createSidebarList({
  id: 'top-items',
  items: [
    {
      label: 'New chat',
      icon: <Compose2 />,
      link: { to: '/app/home', preload: 'viewport', preloadDelay: 1000 },
      id: '/app/home',
    },
    {
      label: 'Library',
      icon: <FolderContent />,
      link: { to: '/app/library', preload: 'intent' },
      id: '/app/library/',
    },
  ],
});

const adminTools: ISidebarGroup = createSidebarGroup({
  label: 'Admin tools',
  id: 'admin-tools',
  icon: <Gear />,
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

const makeSidebarItems = ({
  isUserRegistered,
  isAdmin,
  favoritesDropdownItems,
}: {
  isUserRegistered: boolean;
  isAdmin: boolean;
  favoritesDropdownItems: ISidebarGroup | null;
}) => {
  if (!isUserRegistered) return [];

  const items = [topItems];

  if (isAdmin) {
    items.push(adminTools);
  }

  if (favoritesDropdownItems) {
    items.push(favoritesDropdownItems);
  }

  return items;
};

// {
//   label: 'Chat history',
//   icon: <ASSET_ICONS.chats />,
//   link: {
//     to: '/app/chats',
//     preload: 'viewport',
//     preloadDelay: 2000,
//     activeOptions: {
//       exact: true,
//     },
//   },
//   id: '/app/chats/',
// },

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useIsUserAdmin();
  const isUserRegistered = useIsUserRegistered();

  const favoritesDropdownItems = useFavoriteSidebarPanel();
  const chatHistoryItems = useChatHistorySidebar();

  const sidebarItems: SidebarProps['content'] = useMemo(() => {
    if (!isUserRegistered) return [];

    const items = [topItems];

    if (isAdmin) {
      items.push(adminTools);
    }

    if (chatHistoryItems) items.push(chatHistoryItems);

    if (favoritesDropdownItems) {
      items.push(favoritesDropdownItems);
    }

    return items;
  }, [isAdmin, chatHistoryItems, favoritesDropdownItems, isUserRegistered]);

  return (
    <>
      <Sidebar
        content={sidebarItems}
        header={useMemo(
          () => <SidebarPrimaryHeader hideActions={!isUserRegistered} />,
          [isUserRegistered]
        )}
        footer={useMemo(() => <SidebarUserFooter />, [])}
        useCollapsible={isUserRegistered}
      />

      <LazyErrorBoundary>
        <Suspense fallback={null}>
          <LazyGlobalModals />
        </Suspense>
      </LazyErrorBoundary>
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  const navigate = useNavigate();

  useHotkeys('C', () => {
    navigate({ to: '/app/home' });
  });

  useHotkeys('S', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleGlobalSearch(true);
  });

  return (
    <div className={cn(COLLAPSED_JUSTIFY_CENTER, 'flex min-h-7 items-center')}>
      <Link to={'/app/home'}>
        <BusterLogoWithText className={COLLAPSED_HIDDEN} />
        <BusterLogo className={COLLAPSED_VISIBLE} />
      </Link>
      {!hideActions && (
        <div className={cn(COLLAPSED_HIDDEN, 'items-center gap-2')}>
          <Tooltip title="Search" shortcuts={['S']}>
            <Button
              size="tall"
              variant="ghost"
              rounding={'large'}
              prefix={<Magnifier />}
              onClick={() => toggleGlobalSearch(true)}
            />
          </Tooltip>

          <Tooltip title="Start a chat" shortcuts={['C']}>
            <Link to={'/app/home'}>
              <Button size="tall" rounding={'large'} prefix={<PencilSquareIcon />} />
            </Link>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
