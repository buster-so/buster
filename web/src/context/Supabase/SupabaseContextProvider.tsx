'use client';

import React, { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks';
import { millisecondsFromUnixTimestamp } from '@/lib/date';
import { createContext, useContextSelector } from 'use-context-selector';
import { checkTokenValidityFromServer } from '@/api/buster_rest/nextjs/auth';
import { jwtDecode } from 'jwt-decode';
import type { UseSupabaseUserContextType } from '@/lib/supabase';

const useSupabaseContextInternal = ({
  supabaseContext
}: {
  supabaseContext: UseSupabaseUserContextType;
}) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const expiresAt = useRef(supabaseContext.expiresAt || 5000);
  const [accessToken, setAccessToken] = useState(supabaseContext.accessToken || '');

  const isAnonymousUser = !supabaseContext.user?.id || supabaseContext.user?.is_anonymous === true;

  const checkTokenValidity = useMemoizedFn(async () => {
    try {
      const decoded = jwtDecode(accessToken);
      const expiresAtDecoded = decoded?.exp || 0;
      const ms = millisecondsFromUnixTimestamp(expiresAtDecoded);
      const isTokenExpired = ms < 5 * 60 * 1000; // 5 minutes

      console.log('isAnonymousUser', isAnonymousUser);
      console.log('isTokenExpired', isTokenExpired);
      console.log(decoded);
      if (isAnonymousUser) {
        console.log(supabaseContext);
        return {
          access_token: accessToken,
          expires_at: expiresAt.current,
          isTokenValid: true
        };
      }

      if (isTokenExpired) {
        const res = await checkTokenValidityFromServer({ accessToken });
        onUpdateToken({ accessToken: res.access_token, expiresAt: res.expires_at });
        return res;
      }

      return {
        access_token: accessToken,
        expires_at: expiresAtDecoded,
        isTokenValid: true
      };
    } catch (e) {
      console.error(e);
      throw e;
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

  useEffect(() => {
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
    user: supabaseContext.user,
    checkTokenValidity
  };
};

const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>(
  {} as ReturnType<typeof useSupabaseContextInternal>
);

export const SupabaseContextProvider: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseUserContextType;
  }>
> = React.memo(({ supabaseContext, children }) => {
  const value = useSupabaseContextInternal({ supabaseContext });

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';

export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;

export const useSupabaseContext = <T,>(selector: (state: SupabaseContextReturnType) => T) => {
  return useContextSelector(SupabaseContext, selector);
};
