import React from 'react';
import { AppProviders } from '@/context/AppProviders';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { GlobalErrorComponent } from '@/components/features/errors/GlobalErrorComponent';
import type { BusterUserResponse } from '@/api/asset_interfaces';

export const LayoutClient: React.FC<{
  children: React.ReactNode;
  userInfo: BusterUserResponse | undefined;
  supabaseContext: Awaited<ReturnType<typeof getSupabaseServerContext>>;
}> = ({ children, userInfo, supabaseContext }) => {
  return (
    <GlobalErrorComponent>
      <AppProviders userInfo={userInfo} supabaseContext={supabaseContext}>
        {children}
      </AppProviders>
    </GlobalErrorComponent>
  );
};
