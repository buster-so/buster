'use client';

import { BusterRoutesWithArgsRoute, createBusterRoute } from '@/routes/busterRoutes';
import { pathNameToParentRoute, pathNameToRoute } from '@/routes/helpers';
import { useMemoizedFn } from '@/hooks';
import { useRouter, usePathname, useParams } from 'next/navigation';
import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import isEmpty from 'lodash/isEmpty';

export const useAppLayout = () => {
  const { push } = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentRoute = pathNameToRoute(pathname, params);
  const currentParentRoute = pathNameToParentRoute(pathname, params);

  const onChangePage = useMemoizedFn(
    (
      params: BusterRoutesWithArgsRoute | string,
      options?: { shallow?: boolean }
    ): Promise<void> => {
      const targetPath = typeof params === 'string' ? params : createBusterRoute(params);

      // Check if the target URL is exactly the same as current URL (including search params)
      const targetUrl = new URL(targetPath, window.location.origin);
      const currentUrl = new URL(window.location.href);

      // Early return if URLs are identical
      if (targetUrl.toString() === currentUrl.toString()) {
        return Promise.resolve();
      }

      // Extract the pathname without query parameters
      const targetPathname = targetUrl.pathname;
      const currentPathname = currentUrl.pathname;
      const hasQueryParams = targetPath.indexOf('?') !== -1;

      console.log('onChangePage', {
        targetPath,
        targetUrl,
        currentUrl,
        targetPathname,
        currentPathname,
        options
      });

      // Handle shallow routing (only updating query params)
      if (options?.shallow && targetPathname === currentPathname) {
        return new Promise((resolve) => {
          const params = getQueryParamsFromPath(targetPath);
          onChangeQueryParams(params, false);
          resolve();
        });
      }

      return new Promise((resolve) => {
        // Same pathname cases
        if (targetPathname === currentPathname) {
          // Case 1: Remove all query parameters
          if (!hasQueryParams) {
            window.history.pushState({}, '', targetPathname);
            resolve();
            return;
          }

          // Case 2: Update query parameters
          const currentParams = Object.fromEntries(currentUrl.searchParams.entries());
          const targetParams = Object.fromEntries(targetUrl.searchParams.entries());

          // Skip if params are identical
          if (JSON.stringify(currentParams) === JSON.stringify(targetParams)) {
            resolve();
            return;
          }

          push(targetPath);
          waitForUrlChange(() => window.location.href.includes(targetPath), resolve);
          return;
        }

        // Case 3: Different pathname - navigate to new route
        push(targetPath);
        waitForUrlChange(() => window.location.pathname !== currentPathname, resolve);
      });
    }
  );

  //TODO: make this typesafe...
  const onChangeQueryParams = useMemoizedFn(
    (params: Record<string, string | null>, preserveExisting: boolean) => {
      const isRemovingANonExistentParam = isEmpty(params)
        ? false
        : Object.entries(params).every(([key, value]) => {
            return !value ? !window.location.href.includes(key) : false;
          });
      if (isRemovingANonExistentParam) return; //we don't need to do anything if we're removing a non-existent param
      const url = createQueryParams(params, preserveExisting);

      if (url) {
        //we use window.history.pushState instead of router.push for true shallow routing so we do not remount the page
        window.history.pushState({}, '', url);
      }
    }
  );

  return {
    currentRoute,
    onChangePage,
    createQueryParams,
    currentParentRoute,
    onChangeQueryParams
  };
};

const createQueryParams = (params: Record<string, string | null>, preserveExisting: boolean) => {
  const url = new URL(window.location.href);

  if (!preserveExisting) {
    // Clear all existing search parameters
    url.search = '';
  }

  // Add new parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });

  return url;
};

const getQueryParamsFromPath = (path: string): Record<string, string> => {
  const url = new URL(path, window.location.origin);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

// Helper function to wait for URL changes
const waitForUrlChange = (
  condition: () => boolean,
  callback: () => void,
  waitTime: number = 25,
  iteration: number = 0
) => {
  if (condition()) {
    callback();
  } else if (iteration >= 10) {
    callback(); // Resolve anyway after max attempts
  } else {
    const newWaitTime = waitTime * 1.25;
    setTimeout(
      () => waitForUrlChange(condition, callback, newWaitTime, iteration + 1),
      newWaitTime
    );
  }
};

const AppLayoutContext = createContext<ReturnType<typeof useAppLayout>>(
  {} as ReturnType<typeof useAppLayout>
);

export const AppLayoutProvider = React.memo<PropsWithChildren>(({ children }) => {
  const value = useAppLayout();

  return <AppLayoutContext.Provider value={value}>{children}</AppLayoutContext.Provider>;
});
AppLayoutProvider.displayName = 'AppLayoutProvider';

export const useAppLayoutContextSelector = <T,>(
  selector: (state: ReturnType<typeof useAppLayout>) => T
) => useContextSelector(AppLayoutContext, selector);
