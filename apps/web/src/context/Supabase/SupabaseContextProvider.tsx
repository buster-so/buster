'use client';

import { jwtDecode } from 'jwt-decode';
import React, { type PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { checkTokenValidityFromServer } from '@/api/buster_rest/nextjs/auth';
import { useMemoizedFn } from '@/hooks';
import { millisecondsFromUnixTimestamp } from '@/lib/date';
import type { UseSupabaseUserContextType } from '@/lib/supabase';

const PREEMTIVE_REFRESH_MINUTES = 5;

const useSupabaseContextInternal = ({
  supabaseContext
}: {
  supabaseContext: UseSupabaseUserContextType;
}) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [accessToken, setAccessToken] = useState(supabaseContext.accessToken || '');

  const isAnonymousUser = !supabaseContext.user?.id || supabaseContext.user?.is_anonymous === true;

  const getExpiresAt = useMemoizedFn((token?: string) => {
    const decoded = jwtDecode(token || accessToken);
    const expiresAtDecoded = decoded?.exp || 0;
    const ms = millisecondsFromUnixTimestamp(expiresAtDecoded);
    return ms;
  });

  const checkTokenValidity = useMemoizedFn(async () => {
    try {
      const ms = getExpiresAt();
      const minutesUntilExpiration = ms / 60000;
      const isTokenExpired = minutesUntilExpiration < PREEMTIVE_REFRESH_MINUTES; //5 minutes

      if (isAnonymousUser) {
        return {
          access_token: accessToken,
          isTokenValid: isTokenExpired
        };
      }

      if (isTokenExpired) {
        const res = await checkTokenValidityFromServer({
          accessToken,
          preemptiveRefreshMinutes: PREEMTIVE_REFRESH_MINUTES
        });
        onUpdateToken({ accessToken: res.access_token, expiresAt: res.expires_at });
        return res;
      }

      return {
        access_token: accessToken,
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
    }
  );

  useLayoutEffect(() => {
    if (supabaseContext.accessToken) {
      setAccessToken(supabaseContext.accessToken);
    }
  }, [supabaseContext.accessToken]);

  useEffect(() => {
    const setupRefreshTimer = () => {
      const expiresInMs = getExpiresAt();
      const refreshBuffer = PREEMTIVE_REFRESH_MINUTES * 60000; // Refresh minutes before expiration
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
