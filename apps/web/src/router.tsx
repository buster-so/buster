import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import {
  LazyCatchErrorCard,
  LazyGlobalErrorCard,
} from '@/components/features/global/LazyGlobalErrorCard';
import { NotFoundCard } from '@/components/features/global/NotFoundCard';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import * as TanstackQuery from './integrations/tanstack-query/query-client';
import { routeTree } from './routeTree.gen';

export interface AppRouterContext {
  queryClient: QueryClient;
}

export function getRouter() {
  const queryClient = TanstackQuery.getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPendingComponent: FileIndeterminateLoader,
    defaultErrorComponent: LazyGlobalErrorCard,
    defaultNotFoundComponent: NotFoundCard,
    defaultOnCatch: LazyCatchErrorCard,
    defaultPreload: 'intent',
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });
  return router;
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }

  interface StaticDataRouteOption {
    assetType?: AssetType | 'reasoning';
  }

  interface RouteContext {
    assetType?: AssetType | 'reasoning';
  }
}
