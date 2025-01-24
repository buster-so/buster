'use client';

import { AppMaterialIcons } from '@/components';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Menu, MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { Text } from '@/components';
import { SignOutButton } from './SignOutButton';
import { useMemoizedFn } from 'ahooks';
import { useBusterNotifications } from '@/context/BusterNotifications';

type MenuItem = Required<MenuProps>['items'][number];

const accountItems: MenuItem[] = [
  {
    key: BusterRoutes.SETTINGS_PROFILE,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_PROFILE
        })}>
        Profile
      </Link>
    )
  },
  {
    key: BusterRoutes.SETTINGS_PREFERENCES,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_PREFERENCES
        })}>
        Preferences
      </Link>
    )
  },
  {
    key: BusterRoutes.SETTINGS_NOTIFICATIONS,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_NOTIFICATIONS
        })}>
        Notifications
      </Link>
    )
  }
];

const permissionsAndSecurityItems: MenuItem[] = [
  {
    key: BusterRoutes.APP_SETTINGS_USERS,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_USERS
        })}>
        Users
      </Link>
    )
  },
  {
    key: BusterRoutes.APP_DATASETS,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.APP_DATASETS
        })}>
        Datasets
      </Link>
    )
  },
  {
    key: BusterRoutes.APP_SETTINGS_DATASET_GROUPS,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS
        })}>
        Dataset Groups
      </Link>
    )
  },
  {
    key: BusterRoutes.SETTINGS_PERMISSION_GROUPS,
    label: (
      <Link
        href={createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS
        })}>
        Permission Groups
      </Link>
    )
  }
  // {
  //   key: BusterRoutes.APP_SETTINGS_ATTRIBUTES,
  //   label: (
  //     <Link
  //       href={createBusterRoute({
  //         route: BusterRoutes.APP_SETTINGS_ATTRIBUTES
  //       })}>
  //       Attributes
  //     </Link>
  //   )
  // },
  // {
  //   key: BusterRoutes.APP_SETTINGS_SECURITY,
  //   label: (
  //     <Link
  //       href={createBusterRoute({
  //         route: BusterRoutes.APP_SETTINGS_SECURITY
  //       })}>
  //       Security
  //     </Link>
  //   )
  // }
];

const useStyles = createStyles(({ token, css }) => {
  return {
    menuHeader: css`
      height: ${token.controlHeight}px;
      .material-symbols {
        color: ${token.colorIcon};
      }
    `,
    addButton: {
      color: token.colorTextSecondary
    }
  };
});

export const AppSidebarSettings: React.FC<{
  className?: string;
  signOut: () => void;
}> = React.memo(({ signOut }) => {
  const { styles, cx } = useStyles();
  const { openInfoMessage } = useBusterNotifications();
  const currentRoute = useAppLayoutContextSelector((s) => s.currentRoute);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const onAddTeam = useMemoizedFn(() => {
    openInfoMessage('Adding team is not currently supported');
  });

  const teamsList: MenuItem[] = useMemo(
    () => [
      ...userTeams.map((team) => ({
        key: createBusterRoute({
          route: BusterRoutes.SETTINGS_TEAM_ID,
          teamId: team.id
        }),
        label: (
          <Link
            href={createBusterRoute({
              route: BusterRoutes.SETTINGS_TEAM_ID,
              teamId: team.id
            })}>
            {team.name}
          </Link>
        )
      })),
      {
        key: 'addteam',
        label: (
          <div onClick={onAddTeam} className={cx(styles.addButton, 'flex items-center space-x-1')}>
            <AppMaterialIcons size={16} className="-ml-1" icon="add" />
            <Text className="!text-inherit">Add team</Text>
          </div>
        )
      }
    ],
    [userTeams, onAddTeam, styles.addButton, cx]
  );

  const workSpaceItems: MenuItem[] = useMemo(
    () =>
      [
        {
          key: BusterRoutes.SETTINGS_GENERAL,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_GENERAL
              })}>
              General
            </Link>
          )
        },
        {
          key: BusterRoutes.SETTINGS_STORAGE,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_STORAGE
              })}>
              Storage
            </Link>
          )
        },
        {
          key: BusterRoutes.SETTINGS_DATASOURCES,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_DATASOURCES
              })}>
              Data Sources
            </Link>
          )
        },
        {
          key: BusterRoutes.SETTINGS_INTEGRATIONS,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_INTEGRATIONS
              })}>
              Integrations
            </Link>
          )
        },
        {
          key: BusterRoutes.SETTINGS_API_KEYS,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_API_KEYS
              })}>
              API Keys
            </Link>
          ),
          hidden: !isAdmin
        },
        {
          key: BusterRoutes.SETTINGS_EMBEDS,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_EMBEDS
              })}>
              Embedded Analytics
            </Link>
          ),
          hidden: !isAdmin
        },
        {
          key: BusterRoutes.SETTINGS_BILLING,
          label: (
            <Link
              href={createBusterRoute({
                route: BusterRoutes.SETTINGS_BILLING
              })}>
              Billing
            </Link>
          ),
          hidden: !isAdmin
        }
      ].filter((item) => !item.hidden),
    [isAdmin]
  );

  const menus = useMemo(
    () =>
      [
        {
          key: 'myaccount',
          label: 'Account',
          icon: <AppMaterialIcons icon="account_circle" fill />,
          children: accountItems
        },
        {
          key: 'workspace',
          label: 'Workspace',
          icon: <AppMaterialIcons size={16} icon="apartment" />,
          children: workSpaceItems
        },
        {
          key: 'permissionsandsecurity',
          label: 'Permissions & Security',
          icon: <AppMaterialIcons size={16} icon="lock" />,
          children: permissionsAndSecurityItems,
          hidden: !isAdmin
        }
        // {
        //   key: 'teams',
        //   label: 'Teams',
        //   icon: <AppMaterialIcons icon="groups" />,
        //   children: teamsList
        // }
      ].filter((item) => !item.hidden),
    [workSpaceItems, isAdmin, permissionsAndSecurityItems, accountItems, teamsList]
  );

  const allKeys = menus.map((menu) => menu.key);

  const selectedKeys = useMemo(() => {
    return currentRoute ? [currentRoute] : [];
  }, [currentRoute]);

  return (
    <div className="flex h-full flex-col justify-between space-y-5">
      <div className="flex h-full flex-col space-y-5">
        {menus.map((menu) => (
          <div key={menu.key}>
            <div className={cx(styles.menuHeader, 'flex items-center space-x-2')}>
              {menu.icon}
              <Text type="secondary">{menu.label}</Text>
            </div>

            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              defaultOpenKeys={allKeys}
              items={menu.children}
            />
          </div>
        ))}
      </div>

      <SignOutButton signOut={signOut} />
    </div>
  );
});
AppSidebarSettings.displayName = 'AppSidebarSettings';
