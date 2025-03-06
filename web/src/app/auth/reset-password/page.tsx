import React from 'react';
import { resetPassword } from '@/server_context/supabaseAuthMethods';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';
import { getMyUserInfo_server } from '@/api/buster_rest';
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPassword() {
  const supabaseContext = await getSupabaseServerContext();

  const { user } = supabaseContext;

  if (!user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  const busterUser = await getMyUserInfo_server({ jwtToken: supabaseContext.accessToken });

  if (!busterUser?.user?.email) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  return (
    <ResetPasswordForm resetPassword={resetPassword} supabaseUser={user} busterUser={busterUser} />
  );
}
