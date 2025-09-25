import { isServer } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import type { PostHogConfig } from 'posthog-js';
import React, { type PropsWithChildren, useEffect, useState } from 'react';
import {
  useGetUserBasicInfo,
  useGetUserOrganization,
} from '@/api/buster_rest/users/useGetUserInfo';
import { ComponentErrorCard } from '@/components/features/global/ComponentErrorCard';
import { isDev } from '@/config/dev';
import { env } from '@/env';
import { useAppVersionMeta } from '../AppVersion/useAppVersion';

const POSTHOG_KEY = env.VITE_PUBLIC_POSTHOG_KEY;
const DEBUG_POSTHOG = false;

export const BusterPosthogProvider: React.FC<PropsWithChildren> = ({ children }) => {
  if ((isDev && !DEBUG_POSTHOG) || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <ComponentErrorCard
      header="Posthog failed to load"
      message="Our team has been notified via Slack. We'll take a look at the issue ASAP and get back to you."
    >
      <PosthogWrapper>{children}</PosthogWrapper>
    </ComponentErrorCard>
  );
};
BusterPosthogProvider.displayName = 'BusterPosthogProvider';

const options: Partial<PostHogConfig> = {
  person_profiles: 'always',
  session_recording: {
    recordBody: true,
  },
  api_host: '/phrp/',
  ui_host: 'https://us.posthog.com',
  defaults: '2025-05-24',
};

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const appVersionMeta = useAppVersionMeta();
  const user = useGetUserBasicInfo();
  const userOrganizations = useGetUserOrganization();
  const userOrganizationId = userOrganizations?.id || '';
  const userOrganizationName = userOrganizations?.name || '';

  const [posthogModules, setPosthogModules] = useState<{
    posthog: typeof import('posthog-js').default;
    PostHogProvider: typeof import('posthog-js/react').PostHogProvider;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Async load posthog-js dependencies
  useEffect(() => {
    const loadPosthogModules = async () => {
      try {
        const [{ default: posthog }, { PostHogProvider }] = await Promise.all([
          import('posthog-js'),
          import('posthog-js/react'),
        ]);

        setPosthogModules({ posthog, PostHogProvider });
      } catch (error) {
        console.error('Failed to load PostHog modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosthogModules();
  }, []);

  // Initialize PostHog when modules are loaded and user data is available
  useEffect(() => {
    if (POSTHOG_KEY && !isServer && user && posthogModules?.posthog) {
      const { posthog } = posthogModules;

      if (posthog.__loaded) {
        return;
      }

      posthog.init(POSTHOG_KEY, options);

      const email = user.email;
      posthog.identify(email, {
        user,
        organization: userOrganizations,
      });
      posthog.group(userOrganizationId, userOrganizationName);

      // Register app version metadata to be included with all events
      if (appVersionMeta) {
        posthog.register({
          app_version: appVersionMeta.buildId,
          browser_build: appVersionMeta.browserBuild,
          server_build: appVersionMeta.buildId,
          version_changed: appVersionMeta.buildId !== appVersionMeta.browserBuild,
        });
      }
    }
  }, [user?.id, userOrganizationId, userOrganizationName, posthogModules, appVersionMeta]);

  // Update app version metadata when it changes after PostHog is initialized
  useEffect(() => {
    if (posthogModules?.posthog && appVersionMeta) {
      const { posthog } = posthogModules;

      if (posthog.__loaded) {
        posthog.register({
          app_version: appVersionMeta.buildId,
          browser_build: appVersionMeta.browserBuild,
          server_build: appVersionMeta.buildId,
          version_changed: appVersionMeta.buildId !== appVersionMeta.browserBuild,
        });
      }
    }
  }, [appVersionMeta, posthogModules]);

  // Show children while loading or if modules failed to load
  if (isLoading || !posthogModules) {
    return <>{children}</>;
  }

  const { PostHogProvider } = posthogModules;

  if (isServer) {
    return <>{children}</>;
  }

  return (
    <ClientOnly>
      <PostHogProvider client={posthogModules.posthog}>{children}</PostHogProvider>
    </ClientOnly>
  );
};
