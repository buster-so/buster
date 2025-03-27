'use client';

import React from 'react';
import { ShareAssetType } from '@/api/asset_interfaces';
import { ClientSideAnonCheck } from './ClientSideAnonCheck';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { prefetchAssetCheck } from '@/api/buster_rest/assets/queryRequests';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export type AppAssetCheckLayoutProps = {
  assetId: string;
  type: 'metric' | 'dashboard';
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = ({ children, type, assetId }) => {
  return <div>TODO</div>;

  // if (!jwtToken) {
  //   return redirect(
  //     createBusterRoute({
  //       route: BusterRoutes.AUTH_LOGIN
  //     })
  //   );
  // }

  // let { res, queryClient } = await prefetchAssetCheck({
  //   fileType: type,
  //   assetId: assetId,
  //   jwtToken
  // });

  // if (!res) {
  //   return redirect(
  //     createBusterRoute({
  //       route: BusterRoutes.APP_HOME
  //     })
  //   );
  // }

  // const { has_access, password_required, public: pagePublic } = res;

  // const Component = (() => {
  //   if (has_access || (pagePublic && !password_required)) {
  //     return <ClientSideAnonCheck jwtToken={jwtToken}>{children}</ClientSideAnonCheck>;
  //   }

  //   if (pagePublic && password_required) {
  //     return (
  //       <ClientSideAnonCheck jwtToken={jwtToken}>
  //         <AppPasswordAccess assetId={assetId} type={type as ShareAssetType}>
  //           {children}
  //         </AppPasswordAccess>
  //       </ClientSideAnonCheck>
  //     );
  //   }

  //   if (!has_access && !pagePublic) {
  //     return (
  //       <ClientSideAnonCheck jwtToken={jwtToken}>
  //         <AppNoPageAccess assetId={assetId} />
  //       </ClientSideAnonCheck>
  //     );
  //   }

  //   return <>{children}</>;
  // })();

  // return <HydrationBoundary state={dehydrate(queryClient)}>{Component}</HydrationBoundary>;
};
