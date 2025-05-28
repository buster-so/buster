import { AppPageLayout } from '@/components/ui/layouts';
import { checkIfUserIsAdmin_server } from '@/context/Users/checkIfUserIsAdmin';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { redirect } from 'next/navigation';
import type React from 'react';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_PROFILE
      })
    );
  }

  return <AppPageLayout scrollable>{children}</AppPageLayout>;
}
