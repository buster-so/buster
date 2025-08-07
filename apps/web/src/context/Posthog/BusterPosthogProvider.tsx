'use client';

import React, { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { isDev } from '@/config';
import { useUserConfigContextSelector } from '../Users';
import type { Team } from '@buster/server-shared/teams';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const DEBUG_POSTHOG = false;

export const BusterPosthogProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  if ((isDev && !DEBUG_POSTHOG) || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PosthogWrapper>{children}</PosthogWrapper>;
});
BusterPosthogProvider.displayName = 'BusterPosthogProvider';

const makeOptions = () => ({
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'always',
  session_recording: { recordBody: true },
  loaded: () => {
    console.log(
      '%c🚀 Welcome to Buster',
      'background: linear-gradient(to right, #a21caf, #8b1cb1, #6b21a8); color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;'
    );
    console.log(
      '%cBuster is your open-source data analytics platform. Found a bug? The code is open-source! Report it at https://github.com/buster-so/buster. Better yet, fix it yourself and send a PR.',
      'background: #6b21a8; color: white; font-size: 10px; font-weight: normal; padding: 8px; border-radius: 4px;'
    );
  }
});

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const user = useUserConfigContextSelector((state) => state.user);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const team: Team | undefined = userTeams?.[0];
  const [posthogApi, setPosthogApi] = useState<any | null>(null);
  const [Provider, setProvider] = useState<React.ComponentType<{ client: any }> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!POSTHOG_KEY || !user || !team) return;
      const [{ default: posthog }, { PostHogProvider }] = await Promise.all([
        import('posthog-js'),
        import('posthog-js/react')
      ]);
      if (!mounted) return;
      posthog.init(POSTHOG_KEY, makeOptions());
      setPosthogApi(posthog);
      setProvider(() => PostHogProvider);
      const email = user.email;
      posthog.identify(email, { user, organization: userOrganizations, team });
      posthog.group(team?.id, team?.name);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, team?.id]);

  if (!Provider || !posthogApi) return <>{children}</>;
  return <Provider client={posthogApi}>{children}</Provider>;
};
