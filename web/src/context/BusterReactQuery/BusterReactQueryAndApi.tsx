'use client';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useLayoutEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import mainApi from '@/api/buster_rest/instances';
import { defaultRequestHandler } from '@/api/createInstance';
import nextApi from '@/api/next/instances';
import { isDev } from '@/config';
import { useSupabaseContext } from '../Supabase/SupabaseContextProvider';
import { persistOptions } from './createPersister';
import { getQueryClient } from './getQueryClient';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((d) => ({
      default: d.ReactQueryDevtools
    })),
  {
    ssr: false
  }
);
const ReactQueryDevtoolsProduction = dynamic(
  () =>
    import('@tanstack/react-query-devtools/build/modern/production.js').then((d) => ({
      default: d.ReactQueryDevtools
    })),
  {
    ssr: false,
    loading: () => null
  }
);

// Create the persister outside the component

export const BusterReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const checkTokenValidity = useSupabaseContext((state) => state.checkTokenValidity);
  const queryClient = getQueryClient(accessToken);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useLayoutEffect(() => {
    //reset all request interceptors
    mainApi.interceptors.request.eject(0);
    nextApi.interceptors.request.eject(0);
    mainApi.interceptors.request.use((v) => defaultRequestHandler(v, { checkTokenValidity }));
    nextApi.interceptors.request.use((v) => defaultRequestHandler(v, { checkTokenValidity }));
  }, []);

  useHotkeys('meta+shift+i', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDevToolsOpen((prev) => !prev);
  });

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}

      {isDevToolsOpen && (
        <>
          <ReactQueryDevtools initialIsOpen={true} />
          {!isDev && <ReactQueryDevtoolsProduction />}
        </>
      )}
    </PersistQueryClientProvider>
  );
};
