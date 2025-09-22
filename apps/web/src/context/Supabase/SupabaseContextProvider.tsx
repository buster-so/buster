import type { User } from '@supabase/supabase-js';
import React, { useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { useMount } from '@/hooks/useMount';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { getBrowserClient } from '@/integrations/supabase/client';
import type { SimplifiedSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export type SupabaseContextType = {
  supabaseSession: SimplifiedSupabaseSession | undefined;
};

const supabase = getBrowserClient();
const fiveMinutes = 5 * 60 * 1000;

const useSupabaseContextInternal = ({ supabaseSession }: SupabaseContextType) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busterUser = useGetUserBasicInfo();
  const [supabaseUser, setSupabaseUser] = useState<null | User>(null);
  const [accessToken, setAccessToken] = useState(supabaseSession?.accessToken || ''); //used in electric sql

  const isAnonymousUser: boolean = !busterUser?.id || supabaseUser?.is_anonymous === true;

  useMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const expiresIn = session?.expires_in ?? 0;
      const timerMs = expiresIn * 1000 - fiveMinutes;
      const accessToken = session?.access_token ?? '';

      setSupabaseUser(user ?? null);

      if (accessToken) setAccessToken(accessToken);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        supabase.auth.refreshSession();
      }, timerMs);
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  });

  useWindowFocus(() => {
    supabase.auth.refreshSession();
  });

  return {
    supabaseUser,
    isAnonymousUser,
    accessToken,
  };
};

export const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>({
  isAnonymousUser: true,
} as ReturnType<typeof useSupabaseContextInternal>);

export const SupabaseContextProvider: React.FC<
  SupabaseContextType & { children: React.ReactNode }
> = React.memo(({ children, ...props }) => {
  const value = useSupabaseContextInternal(props);

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';

export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;
