'use client';

import { BackButton } from '@/components/ui/buttons';
import { ApartmentBuilding, CircleUser, LockCircle } from '@/components/ui/icons';
import { type ISidebarGroup, Sidebar } from '@/components/ui/sidebar';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo } from 'react';
import { SidebarUserFooter } from './SidebarUserFooter/SidebarUserFooter';

const accountItems = (currentParentRoute: BusterRoutes): ISidebarGroup => ({
  label: 'Account',
  variant: 'icon',
  id: 'account',
  icon: <CircleUser />,
  items: [
    {
      label: 'Profile',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_PROFILE }),
      id: BusterRoutes.SETTINGS_PROFILE,
      active: currentParentRoute === BusterRoutes.SETTINGS_PROFILE
    }
  ]
});

const workspaceItems = (currentParentRoute: BusterRoutes): ISidebarGroup => ({
  label: 'Workspace',
  variant: 'icon',
  id: 'workspace',
  icon: <ApartmentBuilding />,
  items: [
    {
      label: 'API Keys',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_API_KEYS }),
      id: BusterRoutes.SETTINGS_API_KEYS
    },
    {
      label: 'Data Sources',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_DATASOURCES }),
      id: BusterRoutes.SETTINGS_DATASOURCES
    }
  ].map((item) => ({
    ...item,
    active: currentParentRoute === item.id
  }))
});

const permissionAndSecurityItems = (currentParentRoute: BusterRoutes): ISidebarGroup => ({
  label: 'Permission & Security',
  variant: 'icon',
  id: 'permission-and-security',
  icon: <LockCircle />,
  items: [
    {
      label: 'Users',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_USERS }),
      id: createBusterRoute({ route: BusterRoutes.SETTINGS_USERS })
    },
    {
      label: 'Dataset groups',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_DATASET_GROUPS }),
      id: createBusterRoute({ route: BusterRoutes.SETTINGS_DATASET_GROUPS })
    },
    {
      label: 'Permission groups',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_PERMISSION_GROUPS }),
      id: createBusterRoute({ route: BusterRoutes.SETTINGS_PERMISSION_GROUPS })
    }
  ].map((item) => ({
    ...item,
    active: currentParentRoute === item.id
  }))
});

export const SidebarSettings: React.FC = React.memo(() => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const currentParentRoute = useAppLayoutContextSelector((x) => x.currentParentRoute);

  const content = useMemo(() => {
    const items = [accountItems(currentParentRoute)];
    if (isAdmin) {
      items.push(workspaceItems(currentParentRoute));
      items.push(permissionAndSecurityItems(currentParentRoute));
    }
    return items;
  }, [isAdmin, currentParentRoute]);

  return (
    <Sidebar
      content={content}
      header={useMemo(() => <SidebarSettingsHeader />, [])}
      footer={useMemo(() => <SidebarUserFooter />, [])}
    />
  );
});

SidebarSettings.displayName = 'SidebarSettings';

const SidebarSettingsHeader = React.memo(() => {
  return (
    <div>
      <BackButton linkUrl={createBusterRoute({ route: BusterRoutes.APP_HOME })} text="Settings" />
    </div>
  );
});

SidebarSettingsHeader.displayName = 'SidebarSettingsHeader';
