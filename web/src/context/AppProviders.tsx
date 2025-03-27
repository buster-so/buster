import React, { PropsWithChildren } from 'react';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
import { AppLayoutProvider } from './BusterAppLayout';
import { BusterUserConfigProvider } from './Users/BusterUserConfigProvider';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { BusterPosthogProvider } from './Posthog';
import { BusterNewChatProvider } from './Chats';
import type { BusterUserResponse } from '@/api/asset_interfaces';
import type { UseSupabaseUserContextType } from '@/lib/supabase';

// scan({
//   enabled: true,
//   log: true, // logs render info to console (default: false)
//   clearLog: false // clears the console per group of renders (default: false)
// });

export const AppProviders: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseUserContextType;
    userInfo: BusterUserResponse | undefined;
  }>
> = ({ children, supabaseContext, userInfo }) => {
  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>
        <BusterWebSocketProvider>
          <AppLayoutProvider>
            <BusterUserConfigProvider userInfo={userInfo}>
              <BusterAssetsProvider>
                <BusterNewChatProvider>
                  <BusterPosthogProvider>{children}</BusterPosthogProvider>
                </BusterNewChatProvider>
              </BusterAssetsProvider>
            </BusterUserConfigProvider>
          </AppLayoutProvider>
        </BusterWebSocketProvider>
      </BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
};
