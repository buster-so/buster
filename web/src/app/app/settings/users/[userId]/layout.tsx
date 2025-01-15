import { BackButton } from '@/components/buttons/BackButton';
import { createBusterRoute, BusterRoutes } from '@/routes';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-5 px-12 py-12">
      <BackButton
        text="Users"
        linkUrl={createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS })}
      />
      {children}
    </div>
  );
}
