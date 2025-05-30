'use client';

import type React from 'react';
import { useLayoutEffect } from 'react';
import { useSupabaseContext } from '@/context/Supabase';

export const ClientSideAnonCheck: React.FC<{
  children: React.ReactNode;
  jwtToken: string;
}> = ({ jwtToken, children }) => {
  const setAccessToken = useSupabaseContext((state) => state.setAccessToken);

  useLayoutEffect(() => {
    if (jwtToken) setAccessToken(jwtToken);
  }, [jwtToken, setAccessToken]);

  return <>{children}</>;
};
