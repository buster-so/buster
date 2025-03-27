import React from 'react';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { getMyUserInfo_server } from '@/api/buster_rest';
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';
import { resetPassword } from '@/lib/supabase/resetPassword';
import { getSupabaseUserContext } from '@/lib/supabase';

export default async function ResetPassword() {
  const supabaseContext = await getSupabaseUserContext();

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
