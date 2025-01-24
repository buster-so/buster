'use client';

import React, { PropsWithChildren, useContext, useMemo } from 'react';
import { useAppLayoutContextSelector } from '../../../../context/BusterAppLayout';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { BusterRoutes, createBusterRoute } from '@/routes';
import Link from 'next/link';
import { AppMenuGroupSingle } from '@/components/menu/AppMenuGroupSingle';
import { FavoritesDropdown } from './FavoritesDropdown';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from 'ahooks';

const items = [
  // {
  //   key: BusterRoutes.APP_COLLECTIONS + 'home',
  //   label: (
  //     <Link
  //       href={createPageLink({
  //         route: BusterRoutes.APP_THREAD
  //       })}>
  //       Home
  //     </Link>
  //   ),
  // },
  {
    key: BusterRoutes.APP_COLLECTIONS,
    label: (
      <Link
        prefetch={true}
        href={createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS
        })}>
        Collections
      </Link>
    ),
    icon: <AppMaterialIcons icon="note_stack" />
  }
];

export const AppSidebarPrimary: React.FC<
  PropsWithChildren<{
    className?: string;
  }>
> = React.memo(({}) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const isUserRegistered = useUserConfigContextSelector((state) => state.isUserRegistered);
  const currentRoute = useAppLayoutContextSelector((s) => s.currentRoute);
  const onToggleSupportModal = useAppLayoutContextSelector((s) => s.onToggleSupportModal);
  const onToggleInviteModal = useAppLayoutContextSelector((s) => s.onToggleInviteModal);

  const disableLink = useMemoizedFn((route: string) => {
    if (!isUserRegistered) {
      return '';
    }
    return route;
  });

  const myStuffItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          key: BusterRoutes.APP_THREAD,
          label: (
            <Link
              prefetch={true}
              href={disableLink(
                createBusterRoute({
                  route: BusterRoutes.APP_THREAD
                })
              )}>
              Metrics
            </Link>
          ),
          icon: <AppMaterialIcons icon="monitoring" />,
          show: true
        },
        {
          key: BusterRoutes.APP_DASHBOARDS,
          label: (
            <Link
              prefetch={true}
              href={disableLink(
                createBusterRoute({
                  route: BusterRoutes.APP_DASHBOARDS
                })
              )}>
              Dashboards
            </Link>
          ),
          icon: <AppMaterialIcons icon="grid_view" fill />,
          show: true
        },
        {
          key: BusterRoutes.APP_COLLECTIONS,
          label: (
            <Link
              prefetch={true}
              href={disableLink(
                createBusterRoute({
                  route: BusterRoutes.APP_COLLECTIONS
                })
              )}>
              Collections
            </Link>
          ),
          icon: <AppMaterialIcons icon="note_stack" />,
          show: true
        },
        {
          key: BusterRoutes.APP_DATASETS,
          label: (
            <Link
              prefetch={true}
              href={disableLink(
                createBusterRoute({
                  route: BusterRoutes.APP_DATASETS
                })
              )}>
              Datasets
            </Link>
          ),
          icon: <AppMaterialIcons icon="table_view" />,
          show: !isAdmin
        },
        {
          key: BusterRoutes.APP_TERMS,
          label: (
            <Link
              prefetch={true}
              href={disableLink(
                createBusterRoute({
                  route: BusterRoutes.APP_TERMS
                })
              )}>
              Terms & definitions
            </Link>
          ),
          icon: <AppMaterialIcons icon="menu_book" />,
          show: !isAdmin
        }
      ]
        .filter((item) => item.show)
        .map((item) => ({
          ...item,
          show: undefined,
          disabled: !isUserRegistered
        })),
    [isUserRegistered, isAdmin]
  );

  const tryStuff = useMemo(() => {
    return [
      {
        key: 'invite-people',
        label: (
          <AppTooltip
            title={'Invite team members'}
            align={{ offset: [8, 0] }}
            shortcuts={['I', 'P']}
            placement="right">
            <div className="h-full w-full">Invite people</div>
          </AppTooltip>
        ),
        icon: <AppMaterialIcons icon="add" />,
        onClick: () => {
          onToggleInviteModal();
        },
        show: isAdmin
      },
      {
        key: 'support',
        label: (
          <AppTooltip
            title={'Support'}
            align={{ offset: [8, 0] }}
            shortcuts={['S']}
            placement="right">
            <div className="h-full w-full">Leave feedback</div>
          </AppTooltip>
        ),
        icon: <AppMaterialIcons icon="flag" />,
        onClick: () => {
          onToggleSupportModal();
        }
      }
    ].filter((item) => item.show !== false);
  }, [isAdmin]);

  return (
    <div className="flex w-full flex-col space-y-2.5">
      <Menu selectable selectedKeys={[currentRoute]} items={myStuffItems} />

      {isUserRegistered && (
        <>
          {isAdmin && <AdminToolsDropdown currentRoute={currentRoute} />}

          <FavoritesDropdown />

          <AppMenuGroupSingle label="Try" items={tryStuff} selectedKey={currentRoute} />
        </>
      )}
    </div>
  );
});
AppSidebarPrimary.displayName = 'AppSidebarPrimary';

const AdminToolsDropdown: React.FC<{
  currentRoute: string;
}> = React.memo(({ currentRoute }) => {
  const myStuffItems = useMemo(
    () => [
      {
        key: BusterRoutes.APP_LOGS,
        label: (
          <Link
            prefetch={true}
            href={createBusterRoute({
              route: BusterRoutes.APP_LOGS
            })}>
            Logs
          </Link>
        ),
        icon: <AppMaterialIcons icon="list" />
      },
      {
        key: BusterRoutes.APP_TERMS,
        label: (
          <Link
            prefetch={true}
            href={createBusterRoute({
              route: BusterRoutes.APP_TERMS
            })}>
            Terms & definitions
          </Link>
        ),
        icon: <AppMaterialIcons icon="menu_book" />
      },
      {
        key: BusterRoutes.APP_DATASETS,
        label: (
          <Link
            prefetch={true}
            href={createBusterRoute({
              route: BusterRoutes.APP_DATASETS
            })}>
            Datasets
          </Link>
        ),
        icon: <AppMaterialIcons icon="table_view" />
      }
    ],
    []
  );

  return (
    <AppMenuGroupSingle label={'Admin tools'} items={myStuffItems} selectedKey={currentRoute} />
  );
});
AdminToolsDropdown.displayName = 'AdminToolsDropdown';
