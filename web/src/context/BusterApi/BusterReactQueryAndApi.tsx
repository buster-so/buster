'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useLayoutEffect } from 'react';
import mainApi from '@/api/buster-rest/instances';
import { defaultRequestHandler } from '@/api/createInstance';
import nextApi from '@/api/next/instances';
import { useSupabaseContext } from '../Supabase/SupabaseContextProvider';
import { getQueryClient } from './getQueryClient';

export const BusterReactQueryProvider = ({ children }: { children: React.ReactElement }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const queryClient = getQueryClient();

  useLayoutEffect(() => {
    //reset all request interceptors
    mainApi.interceptors.request.eject(0);
    nextApi.interceptors.request.eject(0);
    mainApi.interceptors.request.use((v) => defaultRequestHandler(v, { accessToken }));
    nextApi.interceptors.request.use((v) => defaultRequestHandler(v, { accessToken }));
  }, [accessToken]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
