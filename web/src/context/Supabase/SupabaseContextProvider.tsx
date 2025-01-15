'use client';

import React, { PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import { UseSupabaseContextType } from './useSupabaseContext';
import { useMemoizedFn } from 'ahooks';
import { User } from '@supabase/supabase-js';
import { millisecondsFromUnixTimestamp } from '@/utils';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import { checkTokenValidityFromServer as checkTokenValidityFromServerApiCall } from '@/api/buster-rest/nextjs/auth';
import { jwtDecode } from 'jwt-decode';

const STAGING_DEBUGGER = process.env.NODE_ENV === 'production';

export type SupabaseContextType = {
  accessToken: string;
  expiresAt: number;
  user: User | null;
  refreshToken: () => Promise<{
    accessToken: string;
    expiresAt: number;
  } | null>;
};

const useSupabaseContextInternal = ({
  supabaseContext
}: {
  supabaseContext: UseSupabaseContextType;
}) => {
  const refreshTimerRef = useRef<any>();
  const refreshToken = useRef(supabaseContext.refreshToken || '');
  const expiresAt = useRef(supabaseContext.expiresAt || 5000);
  const isRefreshing = useRef(false);
  const [accessToken, setAccessToken] = useState(supabaseContext.accessToken || '');

  const isAnonymousUser = !supabaseContext.user?.id || supabaseContext.user?.is_anonymous === true;

  const checkTokenValidity = useMemoizedFn(async () => {
    try {
      if (isAnonymousUser) {
        return {
          access_token: accessToken,
          expires_at: expiresAt.current,
          isTokenValid: true,
          refresh_token: refreshToken.current
        };
      }
      isRefreshing.current = true;
      const decoded = jwtDecode(accessToken);
      const expiresAtDecoded = decoded?.exp || 0;
      const ms = millisecondsFromUnixTimestamp(expiresAtDecoded);
      const isTokenExpired = ms < 0;

      if (isTokenExpired) {
        const res = await checkTokenValidityFromServerApiCall({
          accessToken
        });

        onUpdateToken({ accessToken: res.access_token, expiresAt: res.expires_at });
        return res;
      }

      return {
        access_token: accessToken,
        expires_at: expiresAtDecoded,
        isTokenValid: true,
        refresh_token: refreshToken.current
      };
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      isRefreshing.current = false;
    }
  });

  const onUpdateToken = useMemoizedFn(
    async ({ accessToken, expiresAt: _expiresAt }: { accessToken: string; expiresAt: number }) => {
      setAccessToken(accessToken);
      expiresAt.current = _expiresAt;
    }
  );

  useLayoutEffect(() => {
    if (supabaseContext.accessToken) {
      setAccessToken(supabaseContext.accessToken);
    }
  }, [supabaseContext.accessToken]);

  useLayoutEffect(() => {
    const setupRefreshTimer = () => {
      const expiresInMs = millisecondsFromUnixTimestamp(expiresAt.current);
      const refreshBuffer = 60000; // Refresh 1 minute before expiration
      const timeUntilRefresh = Math.max(0, expiresInMs - refreshBuffer);

      // Set up timer for future refresh
      refreshTimerRef.current = setTimeout(() => {
        checkTokenValidity();
      }, timeUntilRefresh);
    };

    setupRefreshTimer();

    // Cleanup timer on unmount or when expiration changes
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [accessToken, checkTokenValidity]);

  return {
    isAnonymousUser,
    setAccessToken,
    accessToken,
    expiresAt: expiresAt,
    user: supabaseContext.user,
    checkTokenValidity
  };
};

const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>(
  {} as ReturnType<typeof useSupabaseContextInternal>
);
export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;

export const useSupabaseContext = <T,>(selector: ContextSelector<SupabaseContextReturnType, T>) => {
  return useContextSelector(SupabaseContext, selector);
};

export const SupabaseContextProvider: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseContextType;
  }>
> = React.memo(({ supabaseContext, children }) => {
  const value = useSupabaseContextInternal({ supabaseContext });

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';
