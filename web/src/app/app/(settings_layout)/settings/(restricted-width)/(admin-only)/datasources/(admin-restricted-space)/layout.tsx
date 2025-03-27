import { checkIfUserIsAdmin_server } from '@/context/Users/checkIfUserIsAdmin';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { redirect } from 'next/navigation';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = checkIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_DATASOURCES
      })
    );
  }

  return <>{children}</>;
}
