import type { UseSupabaseUserContextType } from '@/lib/supabase';
import { HydrationBoundary, type QueryClient, dehydrate } from '@tanstack/react-query';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { AppLayoutProvider } from './BusterAppLayout';
import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { BusterNewChatProvider } from './Chats';
import { BusterPosthogProvider } from './Posthog';
import { RoutePrefetcher } from './RoutePrefetcher';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { BusterUserConfigProvider } from './Users/BusterUserConfigProvider';

// scan({
//   enabled: true,
//   log: true, // logs render info to console (default: false)
//   clearLog: false // clears the console per group of renders (default: false)
// });

export const AppProviders: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseUserContextType;
    queryClient: QueryClient;
  }>
> = ({ children, queryClient, supabaseContext }) => {
  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <BusterWebSocketProvider>
            <AppLayoutProvider>
              <BusterUserConfigProvider>
                <BusterAssetsProvider>
                  <BusterNewChatProvider>
                    <BusterPosthogProvider>{children}</BusterPosthogProvider>
                    <RoutePrefetcher />
                  </BusterNewChatProvider>
                </BusterAssetsProvider>
              </BusterUserConfigProvider>
            </AppLayoutProvider>
          </BusterWebSocketProvider>
        </HydrationBoundary>
      </BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
};
