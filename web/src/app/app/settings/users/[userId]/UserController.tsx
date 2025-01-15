'use client';

import React from 'react';
import { useGetUser } from '@/api/buster-rest';

export const UserController = React.memo(({ userId }: { userId: string }) => {
  const { data, isLoading } = useGetUser({ userId });
  console.log(data);
  return <div>User {userId}</div>;
});

UserController.displayName = 'UserController';
