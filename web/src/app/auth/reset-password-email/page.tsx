'use client';

import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { resetPasswordEmailSend } from '@/lib/supabase/resetPassword';
import { useSearchParams } from 'next/navigation';
import React from 'react';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email') || '';

  return <ResetEmailForm queryEmail={queryEmail} resetPasswordEmailSend={resetPasswordEmailSend} />;
}
