import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { env } from '@/env';
import { Route as AuthResetPasswordRoute } from '../../routes/auth.reset-password';
import { getSupabaseUser } from './getSupabaseUserClient';
import { getSupabaseServerClient } from './server';

export const resetPasswordEmailSend = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data: { email } }) => {
    const supabase = await getSupabaseServerClient();

    const url = env.VITE_PUBLIC_URL;
    const authURLFull = `${url}${AuthResetPasswordRoute.to}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authURLFull,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  });

export const resetPassword = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ password: z.string() }))
  .handler(async ({ data: { password } }) => {
    const supabase = await getSupabaseServerClient();

    const supabaseUser = await getSupabaseUser();

    if (supabaseUser.is_anonymous) {
      console.error('User is anonymous', supabaseUser);
      throw new Error('User is anonymous');
    }

    if (!supabaseUser.email) {
      console.error('User email not found', supabaseUser);
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new Error(error.message);
    }

    return;
  });
