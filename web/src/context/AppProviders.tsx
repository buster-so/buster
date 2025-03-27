import React, { PropsWithChildren } from 'react';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
import { AppLayoutProvider } from './BusterAppLayout';
import { BusterUserConfigProvider } from './Users/BusterUserConfigProvider';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { BusterPosthogProvider } from './Posthog';
import { BusterNewChatProvider } from './Chats';
import type { UseSupabaseUserContextType } from '@/lib/supabase';
import { dehydrate, HydrationBoundary, type QueryClient } from '@tanstack/react-query';

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
