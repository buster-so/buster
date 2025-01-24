import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useCheckIfUserIsAdmin_server } from '@/server_context/user';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = await useCheckIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_GENERAL
      })
    );
  }

  return <>{children}</>;
}
