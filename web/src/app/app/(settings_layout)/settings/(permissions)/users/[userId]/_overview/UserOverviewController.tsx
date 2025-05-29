'use client';

import React from 'react';
import { useGetUser } from '@/api/buster_rest';
import { useUserConfigContextSelector } from '@/context/Users';
import { UserDatasetSearch } from './UserDatasetSearch';
import { UserDefaultAccess } from './UserDefaultAccess';
import { UserLineageHeader } from './UserLineageHeader';

export const UserOverviewController = React.memo(({ userId }: { userId: string }) => {
  const { data: user, refetch: refetchUser } = useGetUser({ userId });
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const myUser = useUserConfigContextSelector((x) => x.user);

  if (!user || !myUser) return null;

  return (
    <>
      <UserDefaultAccess user={user} myUser={myUser} isAdmin={isAdmin} refetchUser={refetchUser} />
      <UserLineageHeader className="mt-12!" user={user} />
      <UserDatasetSearch user={user} />
    </>
  );
});

UserOverviewController.displayName = 'UserController';
