'use client';

import { PropsWithChildren, useContext, useEffect } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';
import { PostHogConfig } from 'posthog-js';
import { isDev } from '@/config';
import posthog from 'posthog-js';
import { useUserConfigContextSelector } from '../Users';
import { isServer } from '@tanstack/react-query';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;

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
    maskAllInputs: false,
    maskInputOptions: {
      password: true
    },
    recordBody: true
  }
};

const PosthogWrapper: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const user = useUserConfigContextSelector((state) => state.user);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const team = userTeams[0];

  useEffect(() => {
    if (POSTHOG_KEY && !isServer && user && posthog && team) {
      posthog.init(POSTHOG_KEY, options);

      const email = user.email;
      posthog.identify(email, {
        user,
        organization: userOrganizations,
        team
      });
      posthog.group(team.id, team.name);
    }
  }, [user?.id, team?.id]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
