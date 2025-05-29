'use client';

import { ShareAssetType } from '@/api/asset_interfaces/share';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { Button } from '@/components/ui/buttons';
import { Flag, Gear, House4, Plus, Table, UnorderedList2 } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
import type { ISidebarGroup, ISidebarList, SidebarProps } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/ui/sidebar/Sidebar';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import {
  useAppLayoutContextSelector,
  useContactSupportModalStore
} from '@/context/BusterAppLayout';
import { useInviteModalStore } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ASSET_ICONS } from '../config/assetIcons';
import { InvitePeopleModal } from '../modal/InvitePeopleModal';
import { SupportModal } from '../modal/SupportModal';
import { SidebarUserFooter } from './SidebarUserFooter/SidebarUserFooter';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

const topItems = (
  currentParentRoute: BusterRoutes,
  favoritedPageType: ShareAssetType | null
): ISidebarList => {
  const isActiveCheck = (type: ShareAssetType, route: BusterRoutes) => currentParentRoute === route;

  return {
    id: 'top-items',
    items: [
      {
        label: 'Home',
        icon: <House4 />,
        route: BusterRoutes.APP_HOME,
        id: BusterRoutes.APP_HOME,
        active: currentParentRoute === BusterRoutes.APP_HOME
      },
      {
        label: 'Chat history',
        icon: <ASSET_ICONS.chats />,
        route: BusterRoutes.APP_CHAT,
        id: BusterRoutes.APP_CHAT,
        active: isActiveCheck(ShareAssetType.CHAT, BusterRoutes.APP_CHAT)
      }
    ]
  };
};

const yourStuff = (
  currentParentRoute: BusterRoutes,
  favoritedPageType: ShareAssetType | null
): ISidebarGroup => {
  const isActiveCheck = (type: ShareAssetType, route: BusterRoutes) =>
    favoritedPageType !== type && favoritedPageType === null && currentParentRoute === route;

  return {
    label: 'Your stuff',
    id: 'your-stuff',
    items: [
      {
        label: 'Metrics',
        icon: <ASSET_ICONS.metrics />,
        route: BusterRoutes.APP_METRIC,
        id: BusterRoutes.APP_METRIC,
        active: isActiveCheck(ShareAssetType.METRIC, BusterRoutes.APP_METRIC)
      },
      {
        label: 'Dashboards',
        icon: <ASSET_ICONS.dashboards />,
        route: BusterRoutes.APP_DASHBOARDS,
        id: BusterRoutes.APP_DASHBOARDS,
        active: isActiveCheck(ShareAssetType.DASHBOARD, BusterRoutes.APP_DASHBOARDS)
      },
      {
        label: 'Collections',
        icon: <ASSET_ICONS.collections />,
        route: BusterRoutes.APP_COLLECTIONS,
        id: BusterRoutes.APP_COLLECTIONS,
        active: isActiveCheck(ShareAssetType.COLLECTION, BusterRoutes.APP_COLLECTIONS)
      }
    ]
  };
};

const adminTools = (currentParentRoute: BusterRoutes): ISidebarGroup => ({
  label: 'Admin tools',
  id: 'admin-tools',
  items: [
    {
      label: 'Logs',
      icon: <UnorderedList2 />,
      route: BusterRoutes.APP_LOGS,
      id: BusterRoutes.APP_LOGS
    },
    // {
    //   label: 'Terms & Definitions',
    //   icon: <BookOpen4 />,
    //   route: BusterRoutes.APP_TERMS,
    //   id: BusterRoutes.APP_TERMS
    // },
    {
      label: 'Datasets',
      icon: <Table />,
      route: BusterRoutes.APP_DATASETS,
      id: BusterRoutes.APP_DATASETS
    }
  ].map((x) => ({
    ...x,
    active: x.route === currentParentRoute
  }))
});

const tryGroup = (
  onClickInvitePeople: () => void,
  onClickLeaveFeedback: () => void,
  isAdmin: boolean
): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
  items: [
    {
      label: 'Invite people',
      icon: <Plus />,
      route: null,
      id: 'invite-people',
      onClick: onClickInvitePeople,
      show: isAdmin
    },
    {
      label: 'Leave feedback',
      icon: <Flag />,
      route: null,
      id: 'leave-feedback',
      onClick: onClickLeaveFeedback
    }
  ].filter((x) => x.show !== false)
});

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const isUserRegistered = useUserConfigContextSelector((x) => x.isUserRegistered);
  const currentParentRoute = useAppLayoutContextSelector((x) => x.currentParentRoute);
  const onToggleInviteModal = useInviteModalStore((s) => s.onToggleInviteModal);
  const onOpenContactSupportModal = useContactSupportModalStore((s) => s.onOpenContactSupportModal);

  const { favoritesDropdownItems, favoritedPageType } = useFavoriteSidebarPanel();

  const topItemsItems = useMemo(
    () => topItems(currentParentRoute, favoritedPageType),
    [currentParentRoute, favoritedPageType]
  );

  const adminToolsItems = useMemo(() => {
    if (!isAdmin) return null;
    return adminTools(currentParentRoute);
  }, [isAdmin, currentParentRoute]);

  const yourStuffItems = useMemo(
    () => yourStuff(currentParentRoute, favoritedPageType),
    [currentParentRoute, favoritedPageType]
  );

  const sidebarItems: SidebarProps['content'] = useMemo(() => {
    if (!isUserRegistered) return [];

    const items = [topItemsItems];

    if (adminToolsItems) {
      items.push(adminToolsItems);
    }

    items.push(yourStuffItems);

    if (favoritesDropdownItems) {
      items.push(favoritesDropdownItems);
    }

    items.push(tryGroup(onToggleInviteModal, () => onOpenContactSupportModal('feedback'), isAdmin));

    return items;
  }, [isUserRegistered, adminToolsItems, yourStuffItems, favoritesDropdownItems]);

  const onCloseSupportModal = useMemoizedFn(() => onOpenContactSupportModal(false));

  const HeaderMemoized = useMemo(
    () => <SidebarPrimaryHeader hideActions={!isUserRegistered} />,
    [isUserRegistered]
  );
  const FooterMemoized = useMemo(() => <SidebarUserFooter />, []);

  return (
    <>
      <Sidebar content={sidebarItems} header={HeaderMemoized} footer={FooterMemoized} />

      <GlobalModals onCloseSupportModal={onCloseSupportModal} />
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  useHotkeys('C', () => {
    onChangePage(BusterRoutes.APP_HOME);
  });

  return (
    <div className="flex items-center justify-between">
      <BusterLogoWithText />
      {!hideActions && (
        <div className="flex items-center gap-2">
          <Tooltip title="Settings">
            <Link href={createBusterRoute({ route: BusterRoutes.SETTINGS_PROFILE })}>
              <Button prefix={<Gear />} variant="ghost" />
            </Link>
          </Tooltip>
          <Tooltip title="Start a chat" shortcuts={['C']}>
            <Link href={createBusterRoute({ route: BusterRoutes.APP_HOME })}>
              <Button
                size="tall"
                rounding={'large'}
                prefix={
                  <div className="flex items-center justify-center">
                    <PencilSquareIcon />
                  </div>
                }
              />
            </Link>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const GlobalModals = ({ onCloseSupportModal }: { onCloseSupportModal: () => void }) => {
  const onToggleInviteModal = useInviteModalStore((s) => s.onToggleInviteModal);
  const openInviteModal = useInviteModalStore((s) => s.openInviteModal);
  const onCloseInviteModal = useMemoizedFn(() => onToggleInviteModal(false));
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const formType = useContactSupportModalStore((s) => s.formType);

  if (isAnonymousUser) return null;

  return (
    <>
      <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
      <SupportModal formType={formType} onClose={onCloseSupportModal} />
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';
