import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { resetPasswordEmailSend } from '@/server_context/supabaseAuthMethods';
import React from 'react';

export default async function ResetPassword(p: { searchParams: Promise<{ email: string }> }) {
  const params = await p.searchParams;
  const queryEmail = params.email;

  return <ResetEmailForm queryEmail={queryEmail} resetPasswordEmailSend={resetPasswordEmailSend} />;
}
