import { isServer } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import type { PostHogConfig } from 'posthog-js';
import React, { type PropsWithChildren, useEffect, useState } from 'react';
import { useGetUserTeams } from '@/api/buster_rest/users';
import {
  useGetUserBasicInfo,
  useGetUserOrganization,
} from '@/api/buster_rest/users/useGetUserInfo';
import { ComponentErrorCard } from '@/components/features/global/ComponentErrorCard';
import { isDev } from '@/config/dev';
import { env } from '@/env';
import packageJson from '../../../package.json';

const version = packageJson.version;
const POSTHOG_KEY = env.VITE_PUBLIC_POSTHOG_KEY;
const DEBUG_POSTHOG = false;

// PostHog failure detection constants
const MAX_CONSECUTIVE_FAILURES = 3;
const FAILURE_TIMEOUT = 5000; // 5 seconds

// Global state for failure tracking
let consecutiveFailures = 0;
let isPosthogBlocked = false;
let failureTimeouts: NodeJS.Timeout[] = [];

/**
 * Monitors PostHog network requests for failures and shuts down PostHog
 * if too many consecutive failures are detected (likely due to ad blockers)
 */
const setupPosthogFailureDetection = (posthog: typeof import('posthog-js').default) => {
  if (isPosthogBlocked) {
    return;
  }

  // Store original methods
  const originalCapture = posthog.capture;
  const originalIdentify = posthog.identify;
  const originalGroup = posthog.group;

  const handleNetworkFailure = () => {
    consecutiveFailures++;
    console.warn(
      `PostHog network failure detected (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`
    );

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.warn('PostHog blocked - shutting down to prevent network bloat');
      shutdownPosthog(posthog);
    }
  };

  const handleNetworkSuccess = () => {
    if (consecutiveFailures > 0) {
      console.info('PostHog network request succeeded - resetting failure count');
      consecutiveFailures = 0;
      // Clear any pending failure timeouts
      failureTimeouts.forEach(clearTimeout);
      failureTimeouts = [];
    }
  };

  const wrapWithFailureDetection = (
    originalMethod: (...args: unknown[]) => unknown,
    methodName: string
  ) => {
    return function (this: unknown, ...args: unknown[]) {
      if (isPosthogBlocked) {
        return;
      }

      try {
        // Set a timeout to detect if the request hangs or fails silently
        const timeoutId = setTimeout(() => {
          console.warn(`PostHog ${methodName} request timed out`);
          handleNetworkFailure();
        }, FAILURE_TIMEOUT);

        failureTimeouts.push(timeoutId);

        // Call original method
        const result = originalMethod.apply(this, args);

        // If the method returns a promise, handle success/failure
        if (result && typeof result.then === 'function') {
          result
            .then(() => {
              clearTimeout(timeoutId);
              const index = failureTimeouts.indexOf(timeoutId);
              if (index > -1) failureTimeouts.splice(index, 1);
              handleNetworkSuccess();
            })
            .catch((error: unknown) => {
              clearTimeout(timeoutId);
              const index = failureTimeouts.indexOf(timeoutId);
              if (index > -1) failureTimeouts.splice(index, 1);
              console.warn(`PostHog ${methodName} failed:`, error);
              handleNetworkFailure();
            });
        } else {
          // For synchronous methods, assume success and clear timeout
          clearTimeout(timeoutId);
          const index = failureTimeouts.indexOf(timeoutId);
          if (index > -1) failureTimeouts.splice(index, 1);
          handleNetworkSuccess();
        }

        return result;
      } catch (error) {
        console.warn(`PostHog ${methodName} error:`, error);
        handleNetworkFailure();
        throw error;
      }
    };
  };

  // Override PostHog methods with failure detection
  posthog.capture = wrapWithFailureDetection(originalCapture, 'capture');
  posthog.identify = wrapWithFailureDetection(originalIdentify, 'identify');
  posthog.group = wrapWithFailureDetection(originalGroup, 'group');
};

const shutdownPosthog = (posthog: typeof import('posthog-js').default) => {
  isPosthogBlocked = true;
  
  try {
    // Clear any pending timeouts
    failureTimeouts.forEach(clearTimeout);
    failureTimeouts = [];
    
    // Stop PostHog from making further requests
    if (posthog?.reset) {
      posthog.reset();
    }
    
    // Override all methods to be no-ops
    const noOp = () => undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.capture = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.identify = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.group = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.alias = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.reset = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.register = noOp as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posthog.unregister = noOp as any;
    
    console.info('PostHog has been shut down due to network failures (likely ad blocker)');
  } catch (error) {
    console.error('Error shutting down PostHog:', error);
  }
};

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

  loaded: () => {
    console.log(
      `%c🚀 Welcome to Buster v${version}`,
      'background: linear-gradient(to right, #a21caf, #8b1cb1, #6b21a8); color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;'
    );
    console.log(
      '%cBuster is your open-source data analytics platform. Found a bug? The code is open-source! Report it at https://github.com/buster-so/buster. Better yet, fix it yourself and send a PR.',
      'background: #6b21a8; color: white; font-size: 10px; font-weight: normal; padding: 8px; border-radius: 4px;'
    );
  },
};

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
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
    if (POSTHOG_KEY && !isServer && user && posthogModules?.posthog && !isPosthogBlocked) {
      const { posthog } = posthogModules;

      if (posthog.__loaded) {
        return;
      }

      posthog.init(POSTHOG_KEY, options);

      // Set up failure detection after initialization
      setupPosthogFailureDetection(posthog);

      const email = user.email;
      posthog.identify(email, {
        user,
        organization: userOrganizations,
      });
      posthog.group(userOrganizationId, userOrganizationName);
    }
  }, [user?.id, userOrganizationId, userOrganizationName, posthogModules]);

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
