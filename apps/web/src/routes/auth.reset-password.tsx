import type { User } from '@supabase/supabase-js';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';
import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';
import { useMount } from '@/hooks/useMount';
import { getBrowserClient } from '@/integrations/supabase/client';
import { getSupabaseUser } from '@/integrations/supabase/getSupabaseUserClient';

export const Route = createFileRoute('/auth/reset-password')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Reset Password' },
      { name: 'description', content: 'Reset your Buster account password' },
      { name: 'og:title', content: 'Reset Password' },
      { name: 'og:description', content: 'Reset your Buster account password' },
    ],
  }),
  beforeLoad: async () => {
    const supabaseUser = await getSupabaseUser();
    return { supabaseUser };
  },
  loader: async ({ context }) => {
    const { supabaseUser } = context;
    return { supabaseUser };
  },

  component: RouteComponent,
  validateSearch: z.object({
    email: z.string().optional(),
  }),
});

const supabase = getBrowserClient();

function RouteComponent() {
  const { email } = Route.useSearch();
  const supabaseUserLoader = Route.useLoaderData();
  const [mounting, setMounting] = useState(true);

  const [supabaseUser, setSupabaseUser] = useState<null | Pick<User, 'email' | 'is_anonymous'>>(
    supabaseUserLoader?.supabaseUser ?? null
  );

  useMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setMounting(false);
      if (session?.user) {
        setSupabaseUser({
          email: session.user.email ?? '',
          is_anonymous: session.user.is_anonymous ?? true,
        });
      }
    });

    setTimeout(() => {
      setMounting(false);
    }, 500);

    return () => {
      subscription.unsubscribe();
    };
  });

  if (mounting) {
    return <CircleSpinnerLoaderContainer />;
  }

  if (email || !supabaseUser || supabaseUser.is_anonymous) {
    return <ResetEmailForm queryEmail={email || ''} />;
  }

  return <ResetPasswordForm supabaseUser={supabaseUser} />;
}
