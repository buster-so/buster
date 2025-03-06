'use client';
//import { scan } from 'react-scan'; // import this BEFORE react

import React, { PropsWithChildren } from 'react';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { UseSupabaseContextType } from './Supabase/getSupabaseServerContext';
import { BusterReactQueryProvider } from './BusterReactQuery/BusterReactQueryAndApi';
import { useMount } from 'ahooks';
import { DatasetProviders } from './Datasets';
import { AppHotKeysProvider } from './AppHotKeys';
import { AppLayoutProvider } from './BusterAppLayout';
import { isDev } from '@/config';
import { BusterDashboardProvider } from './Dashboards/DashboardProvider';
import { BusterUserConfigProvider } from './Users/UserConfigProvider';
import { BusterCollectionsProvider } from './Collections/CollectionsProvider';
import { DataSourceProvider } from './DataSources';
import { BusterSQLProvider } from './SQL/useSQLProvider';
import { BusterTermsProvider } from './Terms/BusterTermsProvider';
import { BusterSearchProvider } from './Search';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { BusterPosthogProvider } from './Posthog/usePosthog';
import { BusterChatProvider } from './Chats';
import { RoutePrefetcher } from './RoutePrefetcher';
import { BusterMetricsProvider } from './Metrics';
import type { BusterUserResponse } from '@/api/asset_interfaces';

// scan({
//   enabled: true,
//   log: true, // logs render info to console (default: false)
//   clearLog: false // clears the console per group of renders (default: false)
// });

export const AppProviders: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseContextType;
    userInfo: BusterUserResponse | undefined;
  }>
> = ({ children, supabaseContext, userInfo }) => {
  useMount(() => {
    if (!isDev) {
      console.log(`
██████╗ ██╗   ██╗███████╗████████╗███████╗██████╗
██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║   ██║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║   ██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝███████║   ██║   ███████╗██║  ██║
  ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
`);
    }
  });

  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>
        <BusterWebSocketProvider>
          <AppLayoutProvider>
            <BusterUserConfigProvider userInfo={userInfo}>
              <BusterAssetsProvider>
                <BusterSearchProvider>
                  <DataSourceProvider>
                    <DatasetProviders>
                      <BusterCollectionsProvider>
                        <BusterMetricsProvider>
                          <BusterDashboardProvider>
                            <BusterSQLProvider>
                              <BusterTermsProvider>
                                <BusterChatProvider>
                                  <AppHotKeysProvider>
                                    <BusterPosthogProvider>
                                      {children}
                                      <RoutePrefetcher />
                                    </BusterPosthogProvider>
                                  </AppHotKeysProvider>
                                </BusterChatProvider>
                              </BusterTermsProvider>
                            </BusterSQLProvider>
                          </BusterDashboardProvider>
                        </BusterMetricsProvider>
                      </BusterCollectionsProvider>
                    </DatasetProviders>
                  </DataSourceProvider>
                </BusterSearchProvider>
              </BusterAssetsProvider>
            </BusterUserConfigProvider>
          </AppLayoutProvider>
        </BusterWebSocketProvider>
      </BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
};
