import { redirect } from 'next/navigation';
import type React from 'react';
import { checkIfUserIsAdmin_server } from '@/context/Users/checkIfUserIsAdmin';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

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
