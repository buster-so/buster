import type { AssetType } from '@buster/server-shared/assets';
import { Link, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
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
import { Flag, Gear, House4, Plus, Table, UnorderedList2 } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
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
import {
  closeContactSupportModal,
  toggleContactSupportModal,
  useContactSupportModalStore,
} from '@/context/GlobalStore/useContactSupportModalStore';
import {
  closeInviteModal,
  toggleInviteModal,
  useInviteModalStore,
} from '@/context/GlobalStore/useInviteModalStore';
import { cn } from '@/lib/classMerge';
import { InvitePeopleModal } from '../../modals/InvitePeopleModal';
import { SupportModal } from '../../modals/SupportModal';
import { SidebarUserFooter } from '../SidebarUserFooter';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

const topItems: ISidebarList = createSidebarList({
  id: 'top-items',
  items: [
    {
      label: 'Home',
      icon: <House4 />,
      link: { to: '/app/home', preload: 'viewport', preloadDelay: 1000 },
      id: '/app/home',
    },
    {
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
    },
  ],
});

const yourStuff: ISidebarGroup = createSidebarGroup({
  label: 'Your stuff',
  id: 'your-stuff',
  items: createSidebarItems(
    [
      {
        label: 'Metrics',
        assetType: 'metric_file' satisfies AssetType,
        icon: <ASSET_ICONS.metrics />,
        link: { to: '/app/metrics' },
        id: '/app/metrics',
      },
      {
        label: 'Dashboards',
        assetType: 'dashboard_file' satisfies AssetType,
        icon: <ASSET_ICONS.dashboards />,
        link: { to: '/app/dashboards' },
        id: '/app/dashboards/',
      },
      {
        label: 'Collections',
        assetType: 'collection' satisfies AssetType,
        icon: <ASSET_ICONS.collections />,
        link: { to: '/app/collections' },
        id: '/app/collections/',
      },
      {
        label: 'Reports',
        assetType: 'report_file' satisfies AssetType,
        icon: <ASSET_ICONS.reports />,
        link: { to: '/app/reports' },
        id: '/app/reports/',
      },
    ].map(({ assetType, ...item }) => ({
      ...item,
      link: {
        ...item.link,
        activeOptions: { exact: true },
      },
      //  active: selectedAssetType === assetType,
    }))
  ),
});

const adminTools: ISidebarGroup = createSidebarGroup({
  label: 'Admin tools',
  id: 'admin-tools',
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

const tryGroup = (showInvitePeople: boolean): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
  items: [
    createSidebarItem({
      label: 'Invite people',
      icon: <Plus />,
      id: 'invite-people',
      onClick: () => toggleInviteModal(),
      show: showInvitePeople,
    }),
    createSidebarItem({
      label: 'Leave feedback',
      icon: <Flag />,
      id: 'leave-feedback',
      onClick: () => toggleContactSupportModal('feedback'),
    }),
  ].reduce((acc, { show, ...item }) => {
    if (show !== false) acc.push(item);
    return acc;
  }, [] as ISidebarItem[]),
});

const makeSidebarItems = ({
  isUserRegistered,
  isAdmin,
  favoritesDropdownItems,
  tryGroupMemoized,
}: {
  isUserRegistered: boolean;
  isAdmin: boolean;
  favoritesDropdownItems: ISidebarGroup | null;
  tryGroupMemoized: ISidebarGroup;
}) => {
  if (!isUserRegistered) return [];

  const items = [topItems];

  if (isAdmin) {
    items.push(adminTools);
  }

  items.push(yourStuff);

  if (favoritesDropdownItems) {
    items.push(favoritesDropdownItems);
  }

  items.push(tryGroupMemoized);

  return items;
};

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useIsUserAdmin();
  const restrictNewUserInvitations = useRestrictNewUserInvitations();
  const isUserRegistered = useIsUserRegistered();

  const favoritesDropdownItems = useFavoriteSidebarPanel();
  //  const selectedAssetType = useGetSelectedAssetTypeLoose();

  const tryGroupMemoized = useMemo(
    () => tryGroup(!restrictNewUserInvitations),
    [restrictNewUserInvitations]
  );

  const sidebarItems: SidebarProps['content'] = makeSidebarItems({
    isUserRegistered,
    isAdmin,
    favoritesDropdownItems,
    tryGroupMemoized,
  });

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

      <GlobalModals />
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  const navigate = useNavigate();

  useHotkeys('C', () => {
    navigate({ to: '/app/home' });
  });

  return (
    <div className={cn(COLLAPSED_JUSTIFY_CENTER, 'flex min-h-7 items-center')}>
      <Link to={'/app/home'}>
        <BusterLogoWithText className={COLLAPSED_HIDDEN} />
        <BusterLogo className={COLLAPSED_VISIBLE} />
      </Link>
      {!hideActions && (
        <div className={cn(COLLAPSED_HIDDEN, 'items-center gap-2')}>
          <Tooltip title="Settings">
            <Link to={'/app/settings/profile'}>
              <Button prefix={<Gear />} variant="ghost" />
            </Link>
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

const GlobalModals = () => {
  const { openInviteModal } = useInviteModalStore();
  const isAnonymousUser = useIsAnonymousUser();
  const { formType } = useContactSupportModalStore();

  if (isAnonymousUser) return null;

  return (
    <>
      <InvitePeopleModal open={openInviteModal} onClose={closeInviteModal} />
      <SupportModal formType={formType} onClose={closeContactSupportModal} />
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';
