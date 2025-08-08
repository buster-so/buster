'use client';

import React, { useMemo } from 'react';
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
import { Button } from '@/components/ui/buttons';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_VISIBLE,
  COLLAPSED_WIDTH_FIT
} from '@/components/ui/sidebar/config';
import { cn } from '@/lib/classMerge';

export const SidebarUserFooter: React.FC = () => {
  const user = useUserConfigContextSelector((x) => x.user);
  const handleSignOut = useSignOut();
  if (!user) return null;

  const { name, email, avatar_url } = user;

  if (!name || !email) return null;

  return (
    <div className={cn(COLLAPSED_WIDTH_FIT, 'overflow-hidden')}>
      <SidebarUserDropdown signOut={handleSignOut}>
        <div className="w-full overflow-hidden">
          <AvatarUserButton
            username={name}
            email={email}
            avatarUrl={avatar_url}
            className={cn(
              COLLAPSED_HIDDEN,
              'hover:bg-item-hover active:bg-item-active w-full cursor-pointer'
            )}
          />
        </div>
        <div className={cn(COLLAPSED_VISIBLE, 'items-center justify-center')}>
          <Button prefix={<Gear />} variant={'ghost'} size={'tall'} />
        </div>
      </SidebarUserDropdown>
    </div>
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
}> = ({ children, signOut }) => {
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
    <Dropdown align="start" side="top" items={allItems}>
      {children}
    </Dropdown>
  );
};

SidebarUserDropdown.displayName = 'SidebarUserDropdown';
