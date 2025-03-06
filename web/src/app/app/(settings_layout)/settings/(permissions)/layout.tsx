import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { checkIfUserIsAdmin_server } from '@/server_context/user';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_PROFILE
      })
    );
  }

  return <>{children}</>;
}
