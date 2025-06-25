'use server';

import { BusterRoutes, createBusterRoute } from '@/routes';
import { createClient } from './server';

export const resetPasswordEmailSend = async ({ email }: { email: string }) => {
  const supabase = await createClient();

  const authURLFull = `${process.env.NEXT_PUBLIC_URL}${createBusterRoute({
    route: BusterRoutes.AUTH_CALLBACK
  })}`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authURLFull
  });

  if (error) {
    return { error: error.message };
  }

  return;
};

export const resetPassword = async ({ password }: { password: string }) => {
  'use server';

  const supabase = await createClient();

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return;
};
