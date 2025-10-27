import { Link, useNavigate } from '@tanstack/react-router';
import React, { lazy, Suspense, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIsUserAdmin, useIsUserRegistered } from '@/api/buster_rest/users/useGetUserInfo';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { Button } from '@/components/ui/buttons';
import { Magnifier } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
import Compose2 from '@/components/ui/icons/NucleoIconOutlined/compose-2';
import FolderContent from '@/components/ui/icons/NucleoIconOutlined/folder-content';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_JUSTIFY_CENTER,
  COLLAPSED_VISIBLE,
  type ISidebarList,
  type SidebarProps,
} from '@/components/ui/sidebar';
import { createSidebarList } from '@/components/ui/sidebar/create-sidebar-item';
import { Sidebar } from '@/components/ui/sidebar/SidebarComponent';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/classMerge';
import { LazyErrorBoundary } from '../../global/LazyErrorBoundary';
import { toggleGlobalSearch } from '../../search/GlobalSearchModal';
import { SidebarUserFooter } from '../SidebarUserFooter';
import { useAdminToolSidebar } from './useAdminToolSidebar';
import { useChatHistorySidebar } from './useChatHistorySidebar';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';
import { useSharedWithMeSidebar } from './useSharedWithMeSidebar';

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

export type SidebarPrimaryProps = {
  defaultOpenChatHistory: boolean;
  defaultOpenFavorites: boolean;
  defaultOpenAdminTools: boolean;
};

export const SidebarPrimary = React.memo(
  ({
    defaultOpenChatHistory,
    defaultOpenFavorites,
    defaultOpenAdminTools,
  }: SidebarPrimaryProps) => {
    const isAdmin = useIsUserAdmin();
    const isUserRegistered = useIsUserRegistered();

    const favoritesDropdownItems = useFavoriteSidebarPanel({ defaultOpenFavorites });
    const chatHistoryItems = useChatHistorySidebar({ defaultOpenChatHistory });
    const adminToolsItems = useAdminToolSidebar({ defaultOpenAdminTools });
    const sharedWithMeItems = useSharedWithMeSidebar();

    const sidebarItems: SidebarProps['content'] = useMemo(() => {
      if (!isUserRegistered) return [];

      const items = [topItems];

      if (sharedWithMeItems) items.push(sharedWithMeItems);

      if (chatHistoryItems) items.push(chatHistoryItems);

      if (favoritesDropdownItems) items.push(favoritesDropdownItems);

      if (isAdmin) items.push(adminToolsItems);

      return items;
    }, [
      isAdmin,
      adminToolsItems,
      chatHistoryItems,
      favoritesDropdownItems,
      sharedWithMeItems,
      isUserRegistered,
    ]);

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
  }
);

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
