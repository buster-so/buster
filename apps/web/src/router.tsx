import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { createRouter, createRouter as createTanstackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
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

// Create a new router instance
// export const createRouter = () => {
//   const queryClient = TanstackQuery.getQueryClient();

//   const router = routerWithQueryClient(
//     createTanstackRouter({
//       routeTree,
//       context: { queryClient },
//       scrollRestoration: true,
//       defaultPreload: 'intent',
//       defaultPendingComponent: FileIndeterminateLoader,
//       defaultErrorComponent: LazyGlobalErrorCard,
//       defaultNotFoundComponent: NotFoundCard,
//       defaultOnCatch: LazyCatchErrorCard,
//       Wrap: (props) => {
//         return (
//           <TanstackQuery.Provider queryClient={queryClient}>
//             {props.children}
//           </TanstackQuery.Provider>
//         );
//       },
//     }),
//     queryClient
//   );

//   return router;
// };

export function getRouter() {
  const queryClient = TanstackQuery.getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPendingComponent: FileIndeterminateLoader,
    defaultErrorComponent: LazyGlobalErrorCard,
    defaultNotFoundComponent: NotFoundCard,
    defaultOnCatch: LazyCatchErrorCard,
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
