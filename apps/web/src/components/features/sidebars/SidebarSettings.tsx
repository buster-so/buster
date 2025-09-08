import { useMemo } from 'react';
import { useIsUserAdmin, useIsUserRegistered } from '@/api/buster_rest/users/useGetUserInfo';
import { BackButton } from '@/components/ui/buttons/BackButton';
import ApartmentBuilding from '@/components/ui/icons/NucleoIconOutlined/apartment-building';
import CircleUser from '@/components/ui/icons/NucleoIconOutlined/circle-user';
import { createSidebarGroup } from '@/components/ui/sidebar/create-sidebar-item';
import LockCircle from '../../ui/icons/NucleoIconOutlined/lock-circle';
import { type ISidebarGroup, Sidebar } from '../../ui/sidebar';
import { ComponentErrorCard } from '../global/ComponentErrorCard';
import { SidebarUserFooter } from './SidebarUserFooter';

const accountItems: ISidebarGroup = createSidebarGroup({
  label: 'Account',
  variant: 'icon',
  id: 'account',
  icon: <CircleUser />,
  items: [
    {
      label: 'Profile',
      link: {
        to: '/app/settings/profile',
      },
      id: '/settings/profile',
    },
  ],
});

const workspaceItems: ISidebarGroup = createSidebarGroup({
  label: 'Administration',
  variant: 'icon',
  id: 'administration',
  icon: <ApartmentBuilding />,
  items: [
    {
      label: 'Workspace',
      link: {
        to: '/app/settings/workspace',
        preload: false,
      },
      id: '/app/settings/workspace',
    },
    {
      label: 'API Keys',
      link: {
        to: '/app/settings/api-keys',
        preload: false,
      },
      id: '/app/settings/api-keys',
    },
    {
      label: 'Data Sources',
      link: {
        to: '/app/settings/datasources',
        preload: false,
      },
      id: '/app/settings/datasources',
    },
    {
      label: 'Integrations',
      link: {
        to: '/app/settings/integrations',
      },
      id: '/app/settings/integrations',
    },
  ],
});

const permissionAndSecurityItems: ISidebarGroup = createSidebarGroup({
  label: 'Permission & Security',
  variant: 'icon',
  id: 'permission-and-security',
  icon: <LockCircle />,
  items: [
    {
      label: 'Security',
      link: { to: '/app/settings/security' },
      id: '/app/settings/security',
    },
    {
      label: 'Users',
      link: { to: '/app/settings/users' },
      id: '/app/settings/users',
    },
    {
      label: 'Dataset groups',
      link: { to: '/app/settings/dataset-groups' },
      id: '/app/settings/dataset-groups',
    },
    {
      label: 'Permission groups',
      link: { to: '/app/settings/permission-groups' },
      id: '/app/settings/permission-groups',
    },
  ],
});

export const SidebarSettings = () => {
  const isAdmin = useIsUserAdmin();
  const isUserRegistered = useIsUserRegistered();

  const sidebarItems = useMemo(() => {
    const items = [accountItems];
    if (isAdmin) {
      items.push(workspaceItems);
      items.push(permissionAndSecurityItems);
    }
    return items;
  }, [isAdmin]);

  return (
    <ComponentErrorCard header="Settings Sidebar">
      <Sidebar
        content={sidebarItems}
        header={useMemo(() => <SidebarSettingsHeader />, [])}
        footer={useMemo(() => <SidebarUserFooter />, [])}
        useCollapsible={isUserRegistered}
      />
    </ComponentErrorCard>
  );
};

SidebarSettings.displayName = 'SidebarSettings';

const SidebarSettingsHeader = () => {
  return (
    <BackButton
      linkUrl={{
        to: '/app/home',
      }}
      text="Settings"
    />
  );
};
