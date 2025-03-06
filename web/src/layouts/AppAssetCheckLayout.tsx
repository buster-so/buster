import React from 'react';
import { getAssetCheck } from '@/api/buster_rest/assets/requests';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { ShareAssetType } from '@/api/asset_interfaces';
import { ClientSideAnonCheck } from './ClientSideAnonCheck';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { AppPasswordAccess } from '@controllers/AppPasswordAccess';
import { AppNoPageAccess } from '@controllers/AppNoPageAccess';
import { signInWithAnonymousUser } from '@/server_context/supabaseAuthMethods';

export type AppAssetCheckLayoutProps = {
  metricId?: string;
  dashboardId?: string;
  type: 'metric' | 'dashboard';
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = async ({ children, type, ...props }) => {
  const { accessToken, user } = await getSupabaseServerContext();
  const isMetric = type === 'metric';

  let jwtToken = accessToken;

  if (!user || !accessToken) {
    const { session } = await signInWithAnonymousUser();
    jwtToken = session?.access_token! || accessToken;
  }

  if (!jwtToken) {
    return <div>No user found 🫣</div>;
  }

  const res = await getAssetCheck({
    type,
    id: isMetric ? props.metricId! : props.dashboardId!,
    jwtToken
  })
    .then((v) => v)
    .catch((e) => null);

  if (!res) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_METRIC
      })
    );
  }

  const { has_access, password_required, public: pagePublic } = res;

  if (has_access || (pagePublic && !password_required)) {
    return <ClientSideAnonCheck jwtToken={jwtToken}>{children}</ClientSideAnonCheck>;
  }

  if (pagePublic && password_required) {
    return (
      <ClientSideAnonCheck jwtToken={jwtToken}>
        <AppPasswordAccess
          metricId={props.metricId}
          dashboardId={props.dashboardId}
          type={type as ShareAssetType}>
          {children}
        </AppPasswordAccess>
      </ClientSideAnonCheck>
    );
  }

  if (!has_access && !pagePublic) {
    return (
      <ClientSideAnonCheck jwtToken={jwtToken}>
        <AppNoPageAccess
          asset_type={type as ShareAssetType}
          metricId={props.metricId}
          dashboardId={props.dashboardId}
        />
      </ClientSideAnonCheck>
    );
  }

  return <>{children}</>;
};
