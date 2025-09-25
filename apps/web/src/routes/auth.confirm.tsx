import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@tanstack/react-router';
import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { Route as AuthResetPasswordRoute } from './auth.reset-password';

const searchParamsSchema = z.object({
  code: z.string().optional(),
  token_hash: z.string().optional(),
  next: z.string().optional(),
  type: z.string().optional(),
});

export const ServerRoute = createServerFileRoute('/auth/confirm').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const { data: searchParams } = searchParamsSchema.safeParse({
      code: url.searchParams.get('code') || undefined,
      token_hash: url.searchParams.get('token_hash') || undefined,
      type: url.searchParams.get('type') || undefined,
      next: url.searchParams.get('next') || undefined,
    });

    if (!searchParams) {
      return new Response('Invalid search params', { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    const { token_hash, type } = searchParams;

    if (!token_hash || !type) {
      return new Response('Invalid search params', { status: 400 });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token_hash,
      type: type as EmailOtpType,
    });

    if (!error) {
      throw redirect({
        to: AuthResetPasswordRoute.to,
        search: {
          email: data.user?.email || '',
        },
      });
    }

    console.error('Error verifying OTP', error);
    return new Response('Error verifying OTP', { status: 400 });
  },
});
