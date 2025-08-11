'use client';

import { jwtDecode } from 'jwt-decode';
import React, { type PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { millisecondsFromUnixTimestamp } from '@/lib/timestamp';
import type { UseSupabaseUserContextType } from '@/lib/supabase';
import { timeout } from '@/lib/timeout';
import { useBusterNotifications } from '../BusterNotifications';
import { flushSync } from 'react-dom';
import { getBrowserClient } from '@/lib/supabase/client';

const PREEMTIVE_REFRESH_MINUTES = 5;
const supabase = getBrowserClient();

const useSupabaseContextInternal = ({
  supabaseContext
}: {
  supabaseContext: UseSupabaseUserContextType;
}) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const backgroundRefreshRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { openErrorNotification, openInfoMessage } = useBusterNotifications();
  const [accessToken, setAccessToken] = useState(supabaseContext.accessToken || '');

  const isAnonymousUser: boolean =
    !supabaseContext.user?.id || supabaseContext.user?.is_anonymous === true;

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
          isTokenValid: !isTokenExpired
        };
      }

      if (isTokenExpired) {
        const { data: refreshedSession, error: refreshedSessionError } =
          await supabase.auth.refreshSession();

        if (refreshedSessionError || !refreshedSession.session) {
          openErrorNotification({
            title: 'Error refreshing session',
            description: 'Please refresh the page and try again',
            duration: 120 * 1000 //2 minutes
          });
          throw refreshedSessionError;
        }

        const accessToken = refreshedSession.session?.access_token;
        const expiresAt = refreshedSession.session?.expires_at ?? 0;

        await onUpdateToken({ accessToken, expiresAt });
        await timeout(25);
        return {
          access_token: accessToken,
          isTokenValid: true
        };
      }

      return {
        access_token: accessToken,
        isTokenValid: true
      };
    } catch (e) {
      console.error(e);
      openErrorNotification({
        title: 'Error checking user authentication',
        description: 'Please try again later',
        duration: 120 * 1000 //2 minutes
      });
      throw e;
    }
  });

  const onUpdateToken = useMemoizedFn(
    async ({ accessToken, expiresAt: _expiresAt }: { accessToken: string; expiresAt: number }) => {
      setAccessToken(accessToken);
      flushSync(() => {
        //noop
      });
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

  useEffect(() => {
    if (isAnonymousUser) return;
    
    const BACKGROUND_CHECK_INTERVAL = 4 * 60 * 1000;
    
    backgroundRefreshRef.current = setInterval(async () => {
      try {
        await checkTokenValidity();
      } catch (error) {
        console.error('Background token refresh failed:', error);
      }
    }, BACKGROUND_CHECK_INTERVAL);

    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, [isAnonymousUser, checkTokenValidity]);

  return {
    isAnonymousUser,
    setAccessToken,
    accessToken,
    user: supabaseContext.user,
    checkTokenValidity
  };
};

const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>({
  isAnonymousUser: true
} as ReturnType<typeof useSupabaseContextInternal>);

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
