'use client';
//import { scan } from 'react-scan'; // import this BEFORE react

import React, { PropsWithChildren } from 'react';
import { BusterWebSocketProvider } from './BusterWebSocket';
import { SupabaseContextProvider } from './Supabase/SupabaseContextProvider';
import { UseSupabaseContextType } from './Supabase/useSupabaseContext';
import { BusterReactQueryProvider } from './BusterApi/BusterReactQueryAndApi';
import { useMount } from 'ahooks';
import { DatasetProviders } from './Datasets';
import { AppHotKeysProvider } from './AppHotKeys';
import { AppLayoutProvider } from './BusterAppLayout';
import { isDev } from '@/config';
import { BusterThreadsProvider } from './Threads/BusterThreadsProvider';
import { BusterDashboardProvider } from './Dashboards/DashboardProvider';
import { BusterUserConfigProvider } from './Users/UserConfigProvider';
import { BusterCollectionsProvider } from './Collections/CollectionsProvider';
import { DataSourceProvider } from './DataSources';
import { BusterSQLProvider } from './SQL/useSQLProvider';
import { BusterTermsProvider } from './Terms/BusterTermsProvider';
import { BusterPermissionsProvider } from './Permissions';
import { BusterSearchProvider } from './Search';
import { BusterAssetsProvider } from './Assets/BusterAssetsProvider';
import { BusterUserResponse } from '@/api/buster_rest/users';
import { BusterPosthogProvider } from './Posthog/usePosthog';
import { BusterNotificationsProvider } from './BusterNotifications';
import { RoutePrefetcher } from './RoutePrefetcher';
import { BusterMessageDataProvider } from './MessageData';

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
    <BusterNotificationsProvider>
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
                          <BusterMessageDataProvider>
                            <BusterDashboardProvider>
                              <BusterThreadsProvider>
                                <BusterSQLProvider>
                                  <BusterTermsProvider>
                                    <BusterPermissionsProvider>
                                      <AppHotKeysProvider>
                                        <BusterPosthogProvider>
                                          {children}
                                          <RoutePrefetcher />
                                        </BusterPosthogProvider>
                                      </AppHotKeysProvider>
                                    </BusterPermissionsProvider>
                                  </BusterTermsProvider>
                                </BusterSQLProvider>
                              </BusterThreadsProvider>
                            </BusterDashboardProvider>
                          </BusterMessageDataProvider>
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
    </BusterNotificationsProvider>
  );
};
