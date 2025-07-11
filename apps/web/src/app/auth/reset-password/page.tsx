import { redirect } from 'next/navigation';
import { getMyUserInfo_server } from '@/api/buster_rest/users/requests';
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';
import { getSupabaseUserContext } from '@/lib/supabase';
import { resetPassword } from '@/lib/supabase/resetPassword';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export default async function ResetPassword() {
  const { user, accessToken } = await getSupabaseUserContext();

  if (!user?.id || !accessToken) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.AUTH_LOGIN
      })
    );
  }

  const busterUser = await getMyUserInfo_server({ jwtToken: accessToken });

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
