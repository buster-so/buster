import React from 'react';
import { ResetPasswordForm } from './_ResetPasswordForm';
import { useBusterSupabaseAuthMethods } from '@/hooks/useBusterSupabaseAuthMethods';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { getUserInfo } from '@/api/buster-rest';

export default async function ResetPassword() {
  const supabaseContext = await useSupabaseServerContext();
  const { resetPassword } = useBusterSupabaseAuthMethods();

  const { user } = supabaseContext;

  if (!user?.id) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  const busterUser = await getUserInfo({ jwtToken: supabaseContext.accessToken });

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
