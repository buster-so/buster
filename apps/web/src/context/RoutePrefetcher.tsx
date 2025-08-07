'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react';
import { prefetchGetCollectionsList } from '@/api/buster_rest/collections';
import { prefetchGetDashboardsList } from '@/api/buster_rest/dashboards';
import { prefetchGetMetricsList } from '@/api/buster_rest/metrics';
import { prefetchGetChatsList } from '@/api/buster_rest/chats';
import { useAsyncEffect } from '@/hooks';
import { timeout } from '@/lib';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';

const HIGH_PRIORITY_ROUTES = [
  BusterRoutes.APP_HOME,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_DASHBOARD_ID
];

const LOW_PRIORITY_ROUTES = [
  BusterRoutes.APP_LOGS,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_METRIC,
  BusterRoutes.APP_COLLECTIONS,
  BusterRoutes.APP_DASHBOARDS,
  BusterRoutes.APP_DATASETS,
  BusterRoutes.SETTINGS,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
  BusterRoutes.SETTINGS_USERS
];

const LOW_PRIORITY_PREFETCH: ((queryClient: QueryClient) => Promise<QueryClient>)[] = [
  (queryClient) => prefetchGetChatsList(queryClient),
  (queryClient) => prefetchGetMetricsList(queryClient),
  (queryClient) => prefetchGetDashboardsList(queryClient),
  (queryClient) => prefetchGetCollectionsList(queryClient)
];

export const RoutePrefetcher: React.FC = React.memo(() => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPreFetchedHighPriorityRef = useRef(false);
  const isPreFetchedLowPriorityRef = useRef(false);

  const ENABLE_PREFETCH = process.env.NEXT_PUBLIC_ENABLE_PREFETCH === 'true';

  useAsyncEffect(async () => {
    if (!ENABLE_PREFETCH) return;

    const prefetchRoutes = async (
      routes: BusterRoutes[],
      prefetchFns: typeof LOW_PRIORITY_PREFETCH,
      priority: 'high' | 'low'
    ) => {
      if (priority === 'high' && isPreFetchedHighPriorityRef.current) return;
      if (priority === 'low' && isPreFetchedLowPriorityRef.current) return;

      for (const route of routes) {
        const path = createBusterRoute({ route: route as BusterAppRoutes.APP_COLLECTIONS });
        router.prefetch(path);
      }

      for await (const prefetchFn of prefetchFns) {
        await prefetchFn(queryClient);
      }

      if (priority === 'high') {
        isPreFetchedHighPriorityRef.current = true;
      } else {
        isPreFetchedLowPriorityRef.current = true;
      }
    };

    await new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(resolve, { timeout: 2000 });
      } else {
        setTimeout(resolve, 1500);
      }
    });

    if (!isPreFetchedHighPriorityRef.current) {
      prefetchRoutes(HIGH_PRIORITY_ROUTES, [], 'high');
    }

    if (document.readyState !== 'complete') {
      await Promise.race([
        new Promise((resolve) => {
          window.addEventListener('load', resolve, { once: true });
        }),
        timeout(2000)
      ]);
    }

    const scheduleLow = () => prefetchRoutes(LOW_PRIORITY_ROUTES, LOW_PRIORITY_PREFETCH, 'low');

    let fallbackTimer: NodeJS.Timeout;
    const observer = new PerformanceObserver(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        scheduleLow();
        observer.disconnect();
      }, 1000);
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(scheduleLow, { timeout: 4000 });
      } else {
        fallbackTimer = setTimeout(scheduleLow, 4000);
      }
    } catch {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      scheduleLow();
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [router]);

  return null;
});

RoutePrefetcher.displayName = 'RoutePrefetcher';
