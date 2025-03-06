import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { resetPasswordEmailSend } from '@/server_context/supabaseAuthMethods';
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function ResetPassword(p: { searchParams: Promise<{ email: string }> }) {
  const params = await p.searchParams;
  const queryEmail = params.email;

  return <ResetEmailForm queryEmail={queryEmail} resetPasswordEmailSend={resetPasswordEmailSend} />;
}
