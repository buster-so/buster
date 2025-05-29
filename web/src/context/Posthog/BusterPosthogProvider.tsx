'use client';

import type { BusterUserTeam } from '@/api/asset_interfaces';
import { isDev } from '@/config';
import { isServer } from '@tanstack/react-query';
import type { PostHogConfig } from 'posthog-js';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { type PropsWithChildren, useEffect } from 'react';
import React from 'react';
import { useUserConfigContextSelector } from '../Users';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export const BusterPosthogProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  if (isDev || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PosthogWrapper>{children}</PosthogWrapper>;
});
BusterPosthogProvider.displayName = 'BusterPosthogProvider';

const options: Partial<PostHogConfig> = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'always',
  session_recording: {
    recordBody: true
  },
  loaded: () => {
    console.log(
      '%c🚀 Buster initialized! 🦖',
      'background: linear-gradient(to right, #a21caf, #8b1cb1, #6b21a8); color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;'
    );
  }
};

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const user = useUserConfigContextSelector((state) => state.user);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const team: BusterUserTeam | undefined = userTeams?.[0];

  useEffect(() => {
    if (POSTHOG_KEY && !isServer && user && posthog && team) {
      posthog.init(POSTHOG_KEY, options);

      const email = user.email;
      posthog.identify(email, {
        user,
        organization: userOrganizations,
        team
      });
      posthog.group(team?.id, team?.name);
    }
  }, [user?.id, team?.id]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
