'use client';

import { useSignOut } from '@/components/features/auth/SignOutHandler';
import { AvatarUserButton } from '@/components/ui/avatar/AvatarUserButton';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import {
  ArrowRightFromLine,
  Book2,
  Database,
  Flag,
  Gear,
  Message,
  UserGroup
} from '@/components/ui/icons/NucleoIconOutlined';
import { useContactSupportModalStore } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { BUSTER_DOCS_URL } from '@/routes/externalRoutes';
import React, { useMemo } from 'react';

export const SidebarUserFooter: React.FC = () => {
  const user = useUserConfigContextSelector((x) => x.user);
  const handleSignOut = useSignOut();
  if (!user) return null;

  const { name, email } = user;

  if (!name || !email) return null;

  return (
    <SidebarUserDropdown signOut={handleSignOut}>
      <div className="flex w-full">
        <AvatarUserButton username={name} email={email} />
      </div>
    </SidebarUserDropdown>
  );
};

const topItems: DropdownProps['items'] = [
  {
    label: 'Settings',
    value: 'setting',
    icon: <Gear />,
    link: createBusterRoute({
      route: BusterRoutes.SETTINGS_PROFILE
    })
  },
  {
    label: 'Datasources',
    value: 'datasources',
    link: createBusterRoute({
      route: BusterRoutes.SETTINGS_DATASOURCES
    }),
    icon: <Database />
  },
  {
    label: 'Invite & manage members',
    value: 'invite-manage-members',
    icon: <UserGroup />,
    link: createBusterRoute({
      route: BusterRoutes.SETTINGS_USERS
    })
  }
];

const SidebarUserDropdown: React.FC<{
  children: React.ReactNode;
  signOut: () => void;
}> = React.memo(({ children, signOut }) => {
  const onOpenContactSupportModal = useContactSupportModalStore((s) => s.onOpenContactSupportModal);

  const allItems: DropdownProps['items'] = useMemo(() => {
    return [
      ...topItems,
      { type: 'divider' },
      {
        label: 'Docs',
        value: 'docs',
        link: BUSTER_DOCS_URL,
        linkIcon: 'arrow-external',
        icon: <Book2 />
      },
      {
        label: 'Contact support',
        value: 'contact-support',
        icon: <Message />,
        onClick: () => onOpenContactSupportModal('help')
      },
      {
        label: 'Leave feedback',
        value: 'leave-feedback',
        icon: <Flag />,
        onClick: () => onOpenContactSupportModal('feedback')
      },
      { type: 'divider' },
      {
        label: 'Logout',
        value: 'logout',
        onClick: signOut,
        icon: <ArrowRightFromLine />
      }
    ];
  }, []);

  return (
    <Dropdown align="end" side="right" items={allItems}>
      {children}
    </Dropdown>
  );
});

SidebarUserDropdown.displayName = 'SidebarUserDropdown';
