import React, { useMemo } from 'react';
import { useGetUserBasicInfo, useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { useSignOut } from '@/components/features/auth/useSignOut';
import { AvatarUserButton } from '@/components/ui/avatar/AvatarUserButton';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import {
  ArrowRightFromLine,
  Book2,
  Database,
  Flag,
  Gear,
  Message,
  UserGroup,
} from '@/components/ui/icons/NucleoIconOutlined';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_VISIBLE,
  COLLAPSED_WIDTH_FIT,
} from '@/components/ui/sidebar/config';
import { BUSTER_DOCS_URL } from '@/config/externalRoutes';
import { toggleContactSupportModal } from '@/context/GlobalStore/useContactSupportModalStore';
import { cn } from '@/lib/classMerge';

export const SidebarUserFooter: React.FC = React.memo(() => {
  const user = useGetUserBasicInfo();
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
});

SidebarUserFooter.displayName = 'SidebarUserFooter';

const topItems = ({ isAdmin }: { isAdmin: boolean }) =>
  (
    [
      {
        label: 'Settings',
        value: 'setting',
        icon: <Gear />,
        link: {
          to: '/app/settings/profile',
        },
      },
      {
        label: 'Datasources',
        value: 'datasources',
        link: {
          to: '/app/settings/datasources',
        },
        icon: <Database />,
        show: isAdmin,
      },
      {
        label: 'Shortcuts',
        value: 'shortcuts',
        link: {
          to: '/app/home/shortcuts',
        },
        icon: <div className="w-4 h-4 flex items-center justify-center">/</div>,
      },
      {
        label: 'Invite & manage members',
        value: 'invite-manage-members',
        icon: <UserGroup />,
        link: {
          to: '/app/settings/users',
        },
      },
      { type: 'divider' },
      {
        label: 'Docs',
        value: 'docs',
        link: BUSTER_DOCS_URL,
        linkIcon: 'arrow-external',
        icon: <Book2 />,
      },
      {
        label: 'Contact support',
        value: 'contact-support',
        icon: <Message />,
        onClick: () => toggleContactSupportModal('help'),
      },
      {
        label: 'Leave feedback',
        value: 'leave-feedback',
        icon: <Flag />,
        onClick: () => toggleContactSupportModal('feedback'),
      },
      { type: 'divider' },
    ] satisfies (DropdownProps['items'][number] & { show?: boolean })[]
  ).reduce<DropdownProps['items']>((acc, { show, ...item }) => {
    if (show ?? true) acc.push(item);
    return acc;
  }, []);

const SidebarUserDropdown: React.FC<{
  children: React.ReactNode;
  signOut: () => void;
}> = ({ children, signOut }) => {
  const isAdmin = useIsUserAdmin();
  const allItems: DropdownProps['items'] = useMemo(() => {
    return [
      ...topItems({ isAdmin }),
      {
        label: 'Logout',
        value: 'logout',
        onClick: signOut,
        icon: <ArrowRightFromLine />,
      },
    ];
  }, [isAdmin]);

  return (
    <Dropdown align="start" side="top" items={allItems}>
      {children}
    </Dropdown>
  );
};

SidebarUserDropdown.displayName = 'SidebarUserDropdown';
