'use client';

import { isServer } from '@tanstack/react-query';
import type { PostHogConfig } from 'posthog-js';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import React, { type PropsWithChildren, useEffect } from 'react';
import { isDev } from '@/config';
import { useUserConfigContextSelector } from '../Users';
import type { Team } from '@buster/server-shared/teams';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const DEBUG_POSTHOG = false;

export const BusterPosthogProvider: React.FC<PropsWithChildren> = ({ children }) => {
  if ((isDev && !DEBUG_POSTHOG) || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PosthogWrapper>{children}</PosthogWrapper>;
};
BusterPosthogProvider.displayName = 'BusterPosthogProvider';

const options: Partial<PostHogConfig> = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'always',
  session_recording: {
    recordBody: true
  },

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
};

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const user = useUserConfigContextSelector((state) => state.user);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const team: Team | undefined = userTeams?.[0];

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
