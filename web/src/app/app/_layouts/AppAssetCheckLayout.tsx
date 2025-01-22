import React from 'react';
import { getAssetCheck } from '@/api/buster_rest/assets/requests';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { AppPasswordAccess } from '../_controllers/AppPasswordAccess';
import { AppNoPageAccess } from '../_controllers/AppNoPageAccess';
import { BusterShareAssetType } from '@/api/buster_rest';
import { useBusterSupabaseAuthMethods } from '@/hooks/useBusterSupabaseAuthMethods';
import { ClientSideAnonCheck } from './ClientSideAnonCheck';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export type AppAssetCheckLayoutProps = {
  threadId?: string;
  dashboardId?: string;
  type: 'thread' | 'dashboard';
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = async ({ children, type, ...props }) => {
  const { accessToken, user } = await useSupabaseServerContext();
  const { signInWithAnonymousUser } = useBusterSupabaseAuthMethods();
  const isThread = type === 'thread';

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
    id: isThread ? props.threadId! : props.dashboardId!,
    jwtToken
  })
    .then((v) => v)
    .catch((e) => null);

  if (!res) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_THREAD
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
          threadId={props.threadId}
          dashboardId={props.dashboardId}
          type={type as BusterShareAssetType}>
          {children}
        </AppPasswordAccess>
      </ClientSideAnonCheck>
    );
  }

  if (!has_access && !pagePublic) {
    return (
      <ClientSideAnonCheck jwtToken={jwtToken}>
        <AppNoPageAccess
          asset_type={type as BusterShareAssetType}
          threadId={props.threadId}
          dashboardId={props.dashboardId}
        />
      </ClientSideAnonCheck>
    );
  }

  return <>{children}</>;
};
