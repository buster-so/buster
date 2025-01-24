'use client';

import React from 'react';
import { useGetUser } from '@/api/buster_rest';
import { UserDefaultAccess } from './UserDefaultAccess';
import { useUserConfigContextSelector } from '@/context/Users';
import { UserLineageHeader } from './UserLineageHeader';
import { UserDatasetSearch } from './UserDatasetSearch';

export const UserOverviewController = React.memo(({ userId }: { userId: string }) => {
  const { data: user, refetch: refetchUser } = useGetUser({ userId });
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const myUser = useUserConfigContextSelector((x) => x.user);

  if (!user || !myUser) return null;

  return (
    <>
      <UserDefaultAccess user={user} myUser={myUser} isAdmin={isAdmin} refetchUser={refetchUser} />
      <UserLineageHeader className="!mt-[48px]" user={user} />
      <UserDatasetSearch user={user} />
    </>
  );
});

UserOverviewController.displayName = 'UserController';
